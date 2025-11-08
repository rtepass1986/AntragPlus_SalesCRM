require('dotenv').config();
const { AsanaClient } = require('./dist/asana');
const { executeAutomationRules } = require('./dist/automation-rules');
const { ASANA_SECTIONS } = require('./dist/mapping');

async function testAutomation() {
  console.log('🧪 Testing Automation Rule: Follow Up Call');
  console.log('='.repeat(60));
  
  const asanaClient = new AsanaClient();
  
  // Get all tasks from the project
  console.log('\n📋 Fetching tasks from Sales Pipeline project...');
  const projectGid = '1211755205817009';
  
  try {
    const response = await asanaClient.makeRequest('GET', `/projects/${projectGid}/tasks`, undefined, {
      limit: 10,
      opt_fields: 'gid,name,memberships.section.name,memberships.section.gid'
    });
    
    const tasks = response.data;
    console.log(`Found ${tasks.length} tasks\n`);
    
    // Find a task in "1.Follow Up Call" section
    const followUpSection = ASANA_SECTIONS.FOLLOW_UP_CALL;
    console.log(`Looking for tasks in section: ${followUpSection} (1.Follow Up Call)\n`);
    
    const taskInFollowUp = tasks.find(task => {
      if (task.memberships && task.memberships.length > 0) {
        const sectionGid = task.memberships[0].section?.gid;
        return sectionGid === followUpSection;
      }
      return false;
    });
    
    if (!taskInFollowUp) {
      console.log('❌ No tasks found in "1.Follow Up Call" section');
      console.log('\n💡 To test this:');
      console.log('   1. Manually move a task to "1.Follow Up Call" in Asana');
      console.log('   2. Run this script again');
      console.log('\nOr we can test with any task - enter a task GID:');
      return;
    }
    
    console.log(`✅ Found task: "${taskInFollowUp.name}" (${taskInFollowUp.gid})`);
    console.log(`   Section: ${taskInFollowUp.memberships[0].section?.name || 'unknown'}\n`);
    
    // Get full task details before automation
    console.log('📊 Task details BEFORE automation:');
    const taskBefore = await asanaClient.getTask(taskInFollowUp.gid);
    console.log(`   Start date: ${taskBefore.start_on || 'not set'}`);
    console.log(`   Due date: ${taskBefore.due_on || 'not set'}`);
    console.log(`   Assignee: ${taskBefore.assignee?.name || 'not assigned'}`);
    console.log(`   Created: ${taskBefore.created_at}\n`);
    
    // Execute automation rules
    console.log('🤖 Executing automation rules...');
    await executeAutomationRules(taskInFollowUp.gid, followUpSection, asanaClient);
    
    // Wait a moment for Asana to update
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Get task details after automation
    console.log('\n📊 Task details AFTER automation:');
    const taskAfter = await asanaClient.getTask(taskInFollowUp.gid);
    console.log(`   Start date: ${taskAfter.start_on || 'not set'}`);
    console.log(`   Due date: ${taskAfter.due_on || 'not set'}`);
    console.log(`   Assignee: ${taskAfter.assignee?.name || 'not assigned'}`);
    
    // Verify the rule worked
    console.log('\n✨ Verification:');
    if (taskAfter.start_on && taskAfter.due_on) {
      const startDate = new Date(taskAfter.start_on);
      const dueDate = new Date(taskAfter.due_on);
      const hoursDiff = (dueDate - startDate) / (1000 * 60 * 60);
      
      console.log(`   ✅ Start date set: ${taskAfter.start_on}`);
      console.log(`   ✅ Due date set: ${taskAfter.due_on}`);
      console.log(`   ✅ Time difference: ${hoursDiff} hours (expected: 48)`);
    } else {
      console.log(`   ❌ Dates not set properly`);
    }
    
    if (taskAfter.assignee?.name) {
      console.log(`   ✅ Assigned to: ${taskAfter.assignee.name}`);
    } else {
      console.log(`   ❌ Not assigned`);
    }
    
    console.log('\n🎉 Test complete!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
  }
}

testAutomation();

