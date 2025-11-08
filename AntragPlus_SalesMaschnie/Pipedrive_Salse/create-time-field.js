require('dotenv').config();
const { AsanaClient } = require('./dist/asana');

async function createTimeField() {
  console.log('⏱️  Creating "Time to Complete (hours)" custom field...\n');
  
  const asanaClient = new AsanaClient();
  const workspaceGid = '308803216953534';
  
  try {
    // Create the custom field in the workspace
    const response = await asanaClient.makeRequest('POST', '/custom_fields', {
      data: {
        workspace: workspaceGid,
        resource_subtype: 'number',
        name: 'Time to Complete (hours)',
        description: 'Time taken from task creation to completion in hours',
        precision: 2 // Allow decimals (e.g., 2.5 hours)
      }
    });
    
    const customField = response.data;
    console.log(`✅ Created custom field: "${customField.name}"`);
    console.log(`   GID: ${customField.gid}`);
    console.log(`   Type: ${customField.resource_subtype}\n`);
    
    // Add it to the Sales Pipeline project
    const projectGid = '1211755205817009';
    await asanaClient.makeRequest('POST', `/projects/${projectGid}/addCustomFieldSetting`, {
      data: {
        custom_field: customField.gid,
        is_important: false
      }
    });
    
    console.log(`✅ Added field to Sales Pipeline project\n`);
    console.log(`📝 Add this to src/mapping.ts:`);
    console.log(`   TIME_TO_COMPLETE: '${customField.gid}',\n`);
    
    return customField.gid;
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.message.includes('already exists')) {
      console.log('\n💡 Field might already exist. Fetching existing fields...');
    }
  }
}

createTimeField();

