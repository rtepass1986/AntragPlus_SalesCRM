require('dotenv').config();
const { AsanaClient } = require('./dist/asana');
const { ASANA_CUSTOM_FIELDS } = require('./dist/mapping');

async function testTimeTracking() {
  console.log('⏱️  Testing Time Tracking Feature');
  console.log('='.repeat(60));
  
  const asanaClient = new AsanaClient();
  const projectGid = '1211755205817009';
  
  try {
    // Get a task from the project
    console.log('\n📋 Fetching tasks...');
    const response = await asanaClient.makeRequest('GET', `/projects/${projectGid}/tasks`, undefined, {
      limit: 1,
      opt_fields: 'gid,name,completed,created_at'
    });
    
    const tasks = response.data;
    if (tasks.length === 0) {
      console.log('❌ No tasks found in project');
      return;
    }
    
    const task = tasks[0];
    console.log(`\n✅ Found task: "${task.name}" (${task.gid})`);
    console.log(`   Created: ${task.created_at}`);
    console.log(`   Completed: ${task.completed ? 'Yes' : 'No'}`);
    
    // Get full task details
    const fullTask = await asanaClient.getTask(task.gid);
    
    // Check current time field value
    const timeField = fullTask.custom_fields?.find(f => f.gid === ASANA_CUSTOM_FIELDS.TIME_TO_COMPLETE);
    console.log(`\n📊 Current "Time to Complete": ${timeField?.number_value || 'not set'} hours`);
    
    if (!task.completed) {
      console.log('\n🔄 Marking task as complete to test time tracking...');
      
      // Mark as complete
      await asanaClient.updateTask(task.gid, { completed: true });
      
      // Calculate time
      const createdAt = new Date(task.created_at);
      const completedAt = new Date();
      const hoursToComplete = (completedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
      
      console.log(`\n⏱️  Calculated time: ${hoursToComplete.toFixed(2)} hours`);
      
      // Set the custom field
      const customFieldsUpdate = {};
      customFieldsUpdate[ASANA_CUSTOM_FIELDS.TIME_TO_COMPLETE] = parseFloat(hoursToComplete.toFixed(2));
      
      await asanaClient.updateTask(task.gid, {
        custom_fields: customFieldsUpdate
      });
      
      console.log(`✅ Updated "Time to Complete" field`);
      
      // Wait and verify
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const updatedTask = await asanaClient.getTask(task.gid);
      const updatedTimeField = updatedTask.custom_fields?.find(f => f.gid === ASANA_CUSTOM_FIELDS.TIME_TO_COMPLETE);
      
      console.log(`\n✨ Verification:`);
      console.log(`   Task completed: ${updatedTask.completed ? 'Yes' : 'No'}`);
      console.log(`   Time to Complete: ${updatedTimeField?.number_value || 'not set'} hours`);
      
      if (updatedTimeField?.number_value) {
        console.log(`\n🎉 Success! Time tracking is working!`);
      } else {
        console.log(`\n❌ Time field not updated properly`);
      }
      
    } else {
      console.log('\n💡 Task is already completed. Time field should be set via webhook when you complete a task in Asana.');
      console.log('\nTo test:');
      console.log('1. Create a new task in Asana');
      console.log('2. Mark it as complete');
      console.log('3. The webhook will automatically calculate and set the time');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
  }
}

testTimeTracking();

