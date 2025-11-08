import { PipedriveClient } from './pipedrive';
import { AsanaClient } from './asana';
import { getSyncMapping, updateSyncTime, logSyncAction } from './db';
import { FIELD_MAPPINGS, PIPEDRIVE_STAGE_MAPPING, ASANA_PROJECT_MAPPING, ASANA_CUSTOM_FIELDS } from './mapping';
import { retryWithBackoff } from './util';
import { executeAutomationRules } from './automation-rules';

export const handler = async (event: any, context: any) => {
  console.log('Asana webhook received:', JSON.stringify(event, null, 2));
  
  try {
    // Verify webhook signature if needed
    const signature = event.headers['x-hook-signature'] || event.headers['X-Hook-Signature'];
    if (signature && !verifyWebhookSignature(event.body, signature)) {
      console.error('Invalid webhook signature');
      return {
        statusCode: 401,
        body: JSON.stringify({ message: 'Unauthorized' })
      };
    }
    
    const webhookData = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    const { action, resource } = webhookData;
    
    if (!action || !resource) {
      console.log('Invalid webhook data structure');
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Invalid webhook data' })
      };
    }
    
    const taskGid = resource.gid;
    
    console.log(`Processing Asana webhook: ${action} for task ${taskGid}`);
    
    const pipedriveClient = new PipedriveClient();
    const asanaClient = new AsanaClient();
    
    // Find sync mapping by Asana task ID
    const syncMapping = await findSyncMappingByAsanaTaskId(taskGid);
    
    if (!syncMapping) {
      console.log(`No sync mapping found for Asana task ${taskGid}, skipping`);
      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'No sync mapping found' })
      };
    }
    
    if (action === 'added') {
      // New task created - this shouldn't happen often as we create tasks from Pipedrive
      console.log(`New Asana task ${taskGid} created, but sync mapping already exists`);
    } else if (action === 'changed') {
      // Task updated - update corresponding Pipedrive deal
      await handleTaskUpdate(taskGid, syncMapping, pipedriveClient, asanaClient);
    } else if (action === 'deleted') {
      // Task deleted - update Pipedrive deal status
      await handleTaskDeletion(syncMapping, pipedriveClient);
    }
    
    // Update sync time
    await updateSyncTime(syncMapping.pipedriveDealId);
    
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Webhook processed successfully' })
    };
    
  } catch (error) {
    console.error('Error processing Asana webhook:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Webhook processing failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
};

async function findSyncMappingByAsanaTaskId(asanaTaskId: string): Promise<any> {
  const { getDbPool } = await import('./db');
  const pool = getDbPool();
  const client = await pool.connect();
  
  try {
    const result = await client.query(`
      SELECT pipedrive_deal_id, asana_task_id, last_sync_time, sync_direction
      FROM sync_mappings 
      WHERE asana_task_id = $1
    `, [asanaTaskId]);

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      pipedriveDealId: row.pipedrive_deal_id,
      asanaTaskId: row.asana_task_id,
      lastSyncTime: new Date(row.last_sync_time),
      syncDirection: row.sync_direction
    };
  } finally {
    client.release();
  }
}

async function handleTaskUpdate(taskGid: string, syncMapping: any, pipedriveClient: PipedriveClient, asanaClient: AsanaClient) {
  try {
    // Get current task data from Asana
    const asanaTask = await asanaClient.getTask(taskGid);
    
    // Check if task was completed - calculate time to complete
    if (asanaTask.completed && asanaTask.created_at) {
      const createdAt = new Date(asanaTask.created_at);
      const completedAt = new Date();
      const hoursToComplete = (completedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
      
      console.log(`Task completed! Time to complete: ${hoursToComplete.toFixed(2)} hours`);
      
      // Update the Time to Complete custom field
      const customFieldsUpdate: any = {};
      customFieldsUpdate[ASANA_CUSTOM_FIELDS.TIME_TO_COMPLETE] = parseFloat(hoursToComplete.toFixed(2));
      
      await asanaClient.updateTask(taskGid, {
        custom_fields: customFieldsUpdate
      } as any);
      
      console.log(`✅ Updated "Time to Complete" field: ${hoursToComplete.toFixed(2)} hours`);
    }
    
    // Check if task was moved to a different section (trigger automation rules)
    if (asanaTask.memberships && asanaTask.memberships.length > 0) {
      const currentSection = asanaTask.memberships[0].section;
      if (currentSection && currentSection.gid) {
        console.log(`Task is in section: ${currentSection.gid} (${currentSection.name || 'unknown'})`);
        
        // Stop timer when moving to any section (timer will restart if moved to a section with timer rule)
        await stopTaskTimer(taskGid, asanaClient);
        
        // Execute automation rules for this section (will start timer if configured)
        await executeAutomationRules(taskGid, currentSection.gid, asanaClient);
      }
    }
    
    // Get current deal data from Pipedrive
    const pipedriveDeal = await pipedriveClient.getDeal(syncMapping.pipedriveDealId);
    
    const updates: any = {};
    
    // Map Asana task changes to Pipedrive deal fields
    if (asanaTask.name !== pipedriveDeal.title) {
      updates.title = asanaTask.name;
    }
    
    // Sync notes/description
    if (asanaTask.notes && asanaTask.notes !== pipedriveDeal.notes) {
      updates.notes = asanaTask.notes;
    }
    
    if (asanaTask.completed !== (pipedriveDeal.status === 'won')) {
      updates.status = asanaTask.completed ? 'won' : 'open';
      if (asanaTask.completed) {
        updates.won_time = new Date().toISOString();
      }
    }
    
    if (asanaTask.due_on && asanaTask.due_on !== pipedriveDeal.close_time?.split('T')[0]) {
      updates.close_time = new Date(asanaTask.due_on).toISOString();
    }
    
    // Sync section changes to Pipedrive stage
    if (asanaTask.memberships && asanaTask.memberships.length > 0) {
      const currentSection = asanaTask.memberships[0].section;
      if (currentSection && currentSection.gid) {
        // Find the Pipedrive stage ID that matches this Asana section
        const { PIPEDRIVE_TO_ASANA_SECTION } = await import('./mapping');
        const stageId = Object.keys(PIPEDRIVE_TO_ASANA_SECTION).find(
          key => PIPEDRIVE_TO_ASANA_SECTION[parseInt(key)] === currentSection.gid
        );
        
        if (stageId && parseInt(stageId) !== pipedriveDeal.stage_id) {
          updates.stage_id = parseInt(stageId);
          console.log(`Syncing section change: Asana section ${currentSection.gid} -> Pipedrive stage ${stageId}`);
        }
      }
    }
    
    // Update Pipedrive deal if there are changes
    if (Object.keys(updates).length > 0) {
      await pipedriveClient.updateDeal(syncMapping.pipedriveDealId, updates);
      
      await logSyncAction(
        syncMapping.pipedriveDealId,
        taskGid,
        'webhook_update',
        'success',
        undefined,
        { asanaTask, pipedriveDeal, updates }
      );
      
      console.log(`Updated Pipedrive deal ${syncMapping.pipedriveDealId} for task ${taskGid}`);
    }
    
  } catch (error) {
    console.error(`Error updating Pipedrive deal for task ${taskGid}:`, error);
    await logSyncAction(
      syncMapping.pipedriveDealId,
      taskGid,
      'webhook_update',
      'error',
      error instanceof Error ? error.message : 'Unknown error',
      { syncMapping }
    );
    throw error;
  }
}

async function handleTaskDeletion(syncMapping: any, pipedriveClient: PipedriveClient) {
  try {
    // Update Pipedrive deal status to lost
    await pipedriveClient.updateDeal(syncMapping.pipedriveDealId, {
      status: 'lost',
      lost_time: new Date().toISOString()
    });
    
    await logSyncAction(
      syncMapping.pipedriveDealId,
      syncMapping.asanaTaskId,
      'webhook_delete',
      'success',
      undefined,
      { syncMapping }
    );
    
    console.log(`Updated Pipedrive deal ${syncMapping.pipedriveDealId} to lost for deleted task ${syncMapping.asanaTaskId}`);
    
  } catch (error) {
    console.error(`Error handling deletion for task ${syncMapping.asanaTaskId}:`, error);
    await logSyncAction(
      syncMapping.pipedriveDealId,
      syncMapping.asanaTaskId,
      'webhook_delete',
      'error',
      error instanceof Error ? error.message : 'Unknown error',
      { syncMapping }
    );
    throw error;
  }
}

async function stopTaskTimer(taskGid: string, asanaClient: AsanaClient): Promise<void> {
  try {
    console.log(`Stopping timer for task ${taskGid}`);
    
    // Get current task to check if timer is running
    const task = await asanaClient.getTask(taskGid);
    
    // Add a comment to indicate timer stopped
    await asanaClient.addComment(taskGid, '⏱️ Timer stopped (moved to new section)');
    
    console.log(`✅ Timer stopped for task ${taskGid}`);
  } catch (error) {
    console.warn(`Could not stop timer for task ${taskGid}:`, error);
    // Don't throw - timer stopping is not critical
  }
}

function verifyWebhookSignature(body: string, signature: string): boolean {
  // Implement webhook signature verification if needed
  // This would typically involve HMAC verification
  return true; // For now, skip verification
}
