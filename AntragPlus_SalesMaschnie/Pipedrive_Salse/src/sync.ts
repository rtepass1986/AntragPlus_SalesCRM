import { PipedriveClient } from './pipedrive';
import { AsanaClient } from './asana';
import { initDatabase, getSyncMapping, updateSyncTime, logSyncAction } from './db';
import { FIELD_MAPPINGS, PIPEDRIVE_STAGE_MAPPING, ASANA_PROJECT_MAPPING, STAGES_TO_SYNC } from './mapping';
import { retryWithBackoff, chunkArray } from './util';

export const handler = async (event: any, context: any) => {
  console.log('Starting sync process...');
  
  try {
    // Initialize database
    await initDatabase();
    
    const pipedriveClient = new PipedriveClient();
    const asanaClient = new AsanaClient();
    
    // Get recent deals from Pipedrive (last 24 hours, specific stages only)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    console.log('Fetching recent Pipedrive deals from specific stages...');
    const recentDeals = await pipedriveClient.getDeals(100, 0);
    const filteredDeals = recentDeals.filter(deal => 
      new Date(deal.update_time) > yesterday && STAGES_TO_SYNC.includes(deal.stage_id)
    );
    
    console.log(`Found ${filteredDeals.length} recent deals to sync`);
    
    // Get Asana projects
    const asanaProjects = await asanaClient.getProjects();
    console.log(`Found ${asanaProjects.length} Asana projects`);
    
    let syncedCount = 0;
    let errorCount = 0;
    
    // Process deals in chunks
    const dealChunks = chunkArray(filteredDeals, 5);
    
    for (const chunk of dealChunks) {
      const promises = chunk.map(async (deal) => {
        try {
          await syncDeal(deal, pipedriveClient, asanaClient, asanaProjects);
          syncedCount++;
        } catch (error) {
          console.error(`Error syncing deal ${deal.id}:`, error);
          await logSyncAction(
            deal.id,
            null,
            'sync',
            'error',
            error instanceof Error ? error.message : 'Unknown error',
            { deal }
          );
          errorCount++;
        }
      });
      
      await Promise.all(promises);
      
      // Add delay between chunks
      if (dealChunks.indexOf(chunk) < dealChunks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    console.log(`Sync completed. Synced: ${syncedCount}, Errors: ${errorCount}`);
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Sync completed successfully',
        synced: syncedCount,
        errors: errorCount
      })
    };
    
  } catch (error) {
    console.error('Sync failed:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Sync failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
};

async function syncDeal(deal: any, pipedriveClient: PipedriveClient, asanaClient: AsanaClient, asanaProjects: any[]) {
  // Check if deal is already synced
  const existingMapping = await getSyncMapping(deal.id);
  
  if (existingMapping) {
    // Deal already synced, check if it needs updating
    await updateExistingSync(deal, existingMapping, pipedriveClient, asanaClient);
  } else {
    // New deal, create Asana task
    await createNewSync(deal, pipedriveClient, asanaClient, asanaProjects);
  }
}

async function createNewSync(deal: any, pipedriveClient: PipedriveClient, asanaClient: AsanaClient, asanaProjects: any[]) {
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
    'sync_create',
    'success',
    undefined,
    { deal, task: asanaTask }
  );
  
  console.log(`Created Asana task ${asanaTask.gid} for deal ${deal.id}`);
}

async function updateExistingSync(deal: any, syncMapping: any, pipedriveClient: PipedriveClient, asanaClient: AsanaClient) {
  try {
    // Get current Asana task
    const asanaTask = await asanaClient.getTask(syncMapping.asanaTaskId);
    
    const updates: any = {};
    
    // Check for changes and prepare updates
    if (deal.title !== asanaTask.name) {
      updates.name = deal.title;
    }
    
    if (deal.status === 'won' !== asanaTask.completed) {
      updates.completed = deal.status === 'won';
    }
    
    const dealDueDate = deal.close_time ? new Date(deal.close_time).toISOString().split('T')[0] : undefined;
    if (dealDueDate !== asanaTask.due_on) {
      updates.due_on = dealDueDate;
    }
    
    // Update Asana task if there are changes
    if (Object.keys(updates).length > 0) {
      await asanaClient.updateTask(syncMapping.asanaTaskId, updates);
      
      await logSyncAction(
        deal.id,
        syncMapping.asanaTaskId,
        'sync_update',
        'success',
        undefined,
        { deal, updates }
      );
      
      console.log(`Updated Asana task ${syncMapping.asanaTaskId} for deal ${deal.id}`);
    }
    
    // Update sync time
    await updateSyncTime(deal.id);
    
  } catch (error) {
    console.error(`Error updating sync for deal ${deal.id}:`, error);
    await logSyncAction(
      deal.id,
      syncMapping.asanaTaskId,
      'sync_update',
      'error',
      error instanceof Error ? error.message : 'Unknown error',
      { deal, syncMapping }
    );
    throw error;
  }
}
