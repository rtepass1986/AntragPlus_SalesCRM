import { AsanaClient } from './asana';
import { ASANA_SALES_PROJECT_GID } from './mapping';

export const handler = async (event: any, context: any) => {
  console.log('Starting cleanup process...');
  
  try {
    const asanaClient = new AsanaClient();
    
    // Get all tasks from the Sales Pipeline project
    console.log(`Fetching all tasks from project ${ASANA_SALES_PROJECT_GID}...`);
    
    let allTasks: any[] = [];
    let offset: string | undefined = undefined;
    
    // Fetch all tasks with pagination
    while (true) {
      const url = `/projects/${ASANA_SALES_PROJECT_GID}/tasks`;
      const params: any = {
        limit: 100,
        opt_fields: 'gid,name'
      };
      
      if (offset) {
        params.offset = offset;
      }
      
      const response = await (asanaClient as any).makeRequest('GET', url, undefined, params);
      const tasks = response.data || [];
      
      allTasks = allTasks.concat(tasks);
      console.log(`Fetched ${tasks.length} tasks (total so far: ${allTasks.length})`);
      
      // Check if there are more tasks
      if (response.next_page && response.next_page.offset) {
        offset = response.next_page.offset;
      } else {
        break;
      }
    }
    
    console.log(`\nFound ${allTasks.length} tasks to delete`);
    
    if (allTasks.length === 0) {
      console.log('No tasks to delete!');
      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'No tasks to delete', deleted: 0 })
      };
    }
    
    // Delete all tasks
    let deletedCount = 0;
    let errorCount = 0;
    
    for (const task of allTasks) {
      try {
        await (asanaClient as any).makeRequest('DELETE', `/tasks/${task.gid}`);
        deletedCount++;
        
        if (deletedCount % 10 === 0) {
          console.log(`Deleted ${deletedCount}/${allTasks.length} tasks...`);
        }
      } catch (error) {
        console.error(`Error deleting task ${task.gid}:`, error);
        errorCount++;
      }
    }
    
    console.log(`\n✅ Cleanup completed!`);
    console.log(`   Deleted: ${deletedCount} tasks`);
    console.log(`   Errors: ${errorCount} tasks`);
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Cleanup completed',
        deleted: deletedCount,
        errors: errorCount
      })
    };
    
  } catch (error) {
    console.error('Cleanup failed:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Cleanup failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
};

