require('dotenv').config();
const { AsanaClient } = require('./dist/asana');

async function checkCustomFields() {
  console.log('📋 Fetching custom fields from Sales Pipeline project...\n');
  
  const asanaClient = new AsanaClient();
  const projectGid = '1211755205817009';
  
  try {
    const response = await asanaClient.makeRequest('GET', `/projects/${projectGid}`, undefined, {
      opt_fields: 'custom_fields.gid,custom_fields.name,custom_fields.type,custom_fields.resource_subtype'
    });
    
    const customFields = response.data.custom_fields || [];
    
    console.log(`Found ${customFields.length} custom fields:\n`);
    
    customFields.forEach((field, index) => {
      console.log(`${index + 1}. ${field.name}`);
      console.log(`   GID: ${field.gid}`);
      console.log(`   Type: ${field.type || field.resource_subtype}`);
      console.log('');
    });
    
    // Check if there's a time tracking field
    const timeField = customFields.find(f => 
      f.name.toLowerCase().includes('time') || 
      f.name.toLowerCase().includes('hours') ||
      f.name.toLowerCase().includes('duration')
    );
    
    if (timeField) {
      console.log(`✅ Found time tracking field: "${timeField.name}" (${timeField.gid})`);
    } else {
      console.log(`❌ No time tracking field found. You'll need to create one in Asana:`);
      console.log(`   1. Go to your project settings`);
      console.log(`   2. Add a custom field`);
      console.log(`   3. Name it "Time to Complete (hours)" or similar`);
      console.log(`   4. Type: Number`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkCustomFields();

