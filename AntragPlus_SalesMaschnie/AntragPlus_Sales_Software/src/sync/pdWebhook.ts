import { PipedriveClient } from './pipedrive';
import { AsanaClient } from './asana';
import { getSyncMapping, updateSyncTime, logSyncAction } from './db';
import { FIELD_MAPPINGS, PIPEDRIVE_STAGE_MAPPING, ASANA_PROJECT_MAPPING } from './mapping';
import { retryWithBackoff } from './util';

export const handler = async (event: any, context: any) => {
  console.log('Pipedrive webhook received:', JSON.stringify(event, null, 2));
  
  try {
    // Verify webhook signature if needed
    const signature = event.headers['x-pipedrive-signature'] || event.headers['X-Pipedrive-Signature'];
    if (signature && !verifyWebhookSignature(event.body, signature)) {
      console.error('Invalid webhook signature');
      return {
        statusCode: 401,
        body: JSON.stringify({ message: 'Unauthorized' })
      };
    }
    
    const webhookData = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    const { current, previous, meta } = webhookData;
    
    if (!current || !meta) {
      console.log('Invalid webhook data structure');
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Invalid webhook data' })
      };
    }
    
    const dealId = current.id;
    const action = meta.action;
    
    console.log(`Processing Pipedrive webhook: ${action} for deal ${dealId}`);
    
    const pipedriveClient = new PipedriveClient();
    const asanaClient = new AsanaClient();
    
    // Get sync mapping
    const syncMapping = await getSyncMapping(dealId);
    
    if (action === 'added') {
      // New deal created - create corresponding Asana task
      await handleNewDeal(current, pipedriveClient, asanaClient);
    } else if (action === 'updated' && syncMapping) {
      // Deal updated - update corresponding Asana task
      await handleDealUpdate(current, previous, syncMapping, pipedriveClient, asanaClient);
    } else if (action === 'deleted' && syncMapping) {
      // Deal deleted - mark Asana task as completed or delete
      await handleDealDeletion(syncMapping, asanaClient);
    }
    
    // Update sync time
    if (syncMapping) {
      await updateSyncTime(dealId);
    }
    
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Webhook processed successfully' })
    };
    
  } catch (error) {
    console.error('Error processing Pipedrive webhook:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Webhook processing failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
};

async function handleNewDeal(deal: any, pipedriveClient: PipedriveClient, asanaClient: AsanaClient) {
  try {
    // Get Asana projects
    const asanaProjects = await asanaClient.getProjects();
    
    // Determine Asana project based on stage
    const stageName = PIPEDRIVE_STAGE_MAPPING[deal.stage_id?.toString()] || 'Lead';
    const projectName = ASANA_PROJECT_MAPPING[stageName] || 'Sales Pipeline - Leads';
    
    let asanaProject = asanaProjects.find(p => p.name === projectName);
    if (!asanaProject) {
      console.log(`Creating Asana project: ${projectName}`);
      asanaProject = await asanaClient.createProject(projectName);
    }
    
    // Create Asana task
    const taskData = {
      name: deal.title,
      notes: `Pipedrive Deal: ${deal.title}\nValue: ${deal.value} ${deal.currency}\nStage: ${stageName}`,
      due_on: deal.close_time ? new Date(deal.close_time).toISOString().split('T')[0] : undefined,
      completed: deal.status === 'won'
    };
    
    const asanaTask = await asanaClient.createTask(taskData, asanaProject.gid);
    
    // Save sync mapping
    const { saveSyncMapping } = await import('./db');
    await saveSyncMapping({
      pipedriveDealId: deal.id,
      asanaTaskId: asanaTask.gid,
      syncDirection: 'bidirectional'
    });
    
    await logSyncAction(
      deal.id,
      asanaTask.gid,
      'webhook_create',
      'success',
      undefined,
      { deal, task: asanaTask }
    );
    
    console.log(`Created Asana task ${asanaTask.gid} for deal ${deal.id}`);
    
  } catch (error) {
    console.error(`Error creating Asana task for deal ${deal.id}:`, error);
    await logSyncAction(
      deal.id,
      null,
      'webhook_create',
      'error',
      error instanceof Error ? error.message : 'Unknown error',
      { deal }
    );
    throw error;
  }
}

async function handleDealUpdate(current: any, previous: any, syncMapping: any, pipedriveClient: PipedriveClient, asanaClient: AsanaClient) {
  try {
    const updates: any = {};
    
    // Check what fields changed and map them to Asana fields
    if (current.title !== previous?.title) {
      updates.name = current.title;
    }
    
    // Sync notes/description
    if (current.notes && current.notes !== previous?.notes) {
      updates.notes = current.notes;
    }
    
    if (current.status !== previous?.status) {
      updates.completed = current.status === 'won';
    }
    
    if (current.close_time !== previous?.close_time) {
      updates.due_on = current.close_time ? new Date(current.close_time).toISOString().split('T')[0] : undefined;
    }
    
    // Sync stage changes to Asana section
    if (current.stage_id !== previous?.stage_id) {
      const { PIPEDRIVE_TO_ASANA_SECTION, ASANA_SALES_PROJECT_GID } = await import('./mapping');
      const newSectionGid = PIPEDRIVE_TO_ASANA_SECTION[current.stage_id];
      
      if (newSectionGid) {
        console.log(`Syncing stage change: Pipedrive stage ${current.stage_id} -> Asana section ${newSectionGid}`);
        
        // Move task to new section
        await asanaClient.addTaskToSection(syncMapping.asanaTaskId, newSectionGid);
      }
    }
    
    // Update Asana task if there are changes
    if (Object.keys(updates).length > 0) {
      await asanaClient.updateTask(syncMapping.asanaTaskId, updates);
      
      await logSyncAction(
        current.id,
        syncMapping.asanaTaskId,
        'webhook_update',
        'success',
        undefined,
        { current, previous, updates }
      );
      
      console.log(`Updated Asana task ${syncMapping.asanaTaskId} for deal ${current.id}`);
    }
    
  } catch (error) {
    console.error(`Error updating Asana task for deal ${current.id}:`, error);
    await logSyncAction(
      current.id,
      syncMapping.asanaTaskId,
      'webhook_update',
      'error',
      error instanceof Error ? error.message : 'Unknown error',
      { current, previous }
    );
    throw error;
  }
}

async function handleDealDeletion(syncMapping: any, asanaClient: AsanaClient) {
  try {
    // Mark Asana task as completed instead of deleting
    await asanaClient.updateTask(syncMapping.asanaTaskId, {
      completed: true
    });
    
    await logSyncAction(
      syncMapping.pipedriveDealId,
      syncMapping.asanaTaskId,
      'webhook_delete',
      'success',
      undefined,
      { syncMapping }
    );
    
    console.log(`Marked Asana task ${syncMapping.asanaTaskId} as completed for deleted deal ${syncMapping.pipedriveDealId}`);
    
  } catch (error) {
    console.error(`Error handling deletion for deal ${syncMapping.pipedriveDealId}:`, error);
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

function verifyWebhookSignature(body: string, signature: string): boolean {
  // Implement webhook signature verification if needed
  // This would typically involve HMAC verification
  return true; // For now, skip verification
}
