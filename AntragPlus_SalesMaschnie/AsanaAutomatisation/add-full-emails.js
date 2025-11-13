const { request } = require('undici');
const { Pool } = require('pg');

const ASANA_ACCESS_TOKEN = '2/119578449411707/1211767717009213:0bebfc748959ea831799a526ff15a9eb';
const PIPEDRIVE_API_TOKEN = '01df8bc1a848e4b3f55d6e2a79f9a62557a66510';
const DATABASE_URL = 'postgresql://roberttepass@localhost:5432/pipedrive_sync';

const pool = new Pool({ connectionString: DATABASE_URL });

async function getDealEmails(dealId) {
  const url = `https://api.pipedrive.com/v1/deals/${dealId}/mailMessages?api_token=${PIPEDRIVE_API_TOKEN}`;
  
  const response = await request(url, {
    method: 'GET',
    headers: { 'Accept': 'application/json' }
  });
  
  const data = await response.body.json();
  return data.data || [];
}

async function getEmailBody(bodyUrl) {
  try {
    // The body_url contains the full URL with auth token
    const fullUrl = `https://api.pipedrive.com${bodyUrl}&api_token=${PIPEDRIVE_API_TOKEN}`;
    
    const response = await request(fullUrl, {
      method: 'GET',
      headers: { 'Accept': 'text/html,text/plain,application/json' }
    });
    
    const body = await response.body.text();
    return body;
  } catch (error) {
    console.error('Error fetching email body:', error.message);
    return null;
  }
}

async function addAsanaComment(taskGid, text) {
  const url = `https://app.asana.com/api/1.0/tasks/${taskGid}/stories`;
  
  try {
    const response = await request(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ASANA_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        data: {
          text,
          type: 'comment'
        }
      })
    });
    
    return response.statusCode === 201 || response.statusCode === 200;
  } catch (error) {
    console.error(`Error adding comment:`, error.message);
    return false;
  }
}

async function getTaskComments(taskGid) {
  const url = `https://app.asana.com/api/1.0/tasks/${taskGid}/stories?opt_fields=text,type`;
  
  const response = await request(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${ASANA_ACCESS_TOKEN}`,
      'Accept': 'application/json'
    }
  });
  
  const data = await response.body.json();
  return data.data.filter(story => story.type === 'comment');
}

async function deleteComment(commentGid) {
  const url = `https://app.asana.com/api/1.0/stories/${commentGid}`;
  
  try {
    await request(url, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${ASANA_ACCESS_TOKEN}`,
        'Accept': 'application/json'
      }
    });
    return true;
  } catch (error) {
    return false;
  }
}

async function main() {
  console.log('Adding FULL email correspondence as individual comments...\n');
  
  const result = await pool.query('SELECT pipedrive_deal_id, asana_task_id FROM sync_mappings ORDER BY pipedrive_deal_id');
  const mappings = result.rows;
  
  console.log(`Processing ${mappings.length} tasks...\n`);
  
  let totalEmailsAdded = 0;
  let skipped = 0;
  let failed = 0;
  
  for (const mapping of mappings) {
    const dealId = mapping.pipedrive_deal_id;
    const taskGid = mapping.asana_task_id;
    
    try {
      console.log(`\nProcessing Deal ${dealId}...`);
      
      // First, delete old email comments if they exist
      const existingComments = await getTaskComments(taskGid);
      const emailComments = existingComments.filter(c => 
        c.text && (c.text.includes('📧 Email Correspondence') || c.text.includes('--- Email'))
      );
      
      if (emailComments.length > 0) {
        console.log(`  Deleting ${emailComments.length} old email comments...`);
        for (const comment of emailComments) {
          await deleteComment(comment.gid);
        }
      }
      
      const emails = await getDealEmails(dealId);
      
      if (!emails || emails.length === 0) {
        console.log(`  No emails, skipping`);
        skipped++;
        continue;
      }
      
      // Sort emails by date (oldest first)
      const sortedEmails = emails.sort((a, b) => {
        const dateA = new Date(a.data.message_time).getTime();
        const dateB = new Date(b.data.message_time).getTime();
        return dateA - dateB;
      });
      
      console.log(`  Found ${emails.length} emails, adding as individual comments...`);
      
      let addedCount = 0;
      
      for (let i = 0; i < sortedEmails.length; i++) {
        const email = sortedEmails[i];
        const emailData = email.data;
        
        const date = new Date(emailData.message_time).toLocaleString('de-DE');
        const from = emailData.from?.[0]?.name || emailData.from?.[0]?.email_address || 'Unknown';
        const fromEmail = emailData.from?.[0]?.email_address || '';
        const to = emailData.to?.map(t => `${t.name || ''} <${t.email_address || ''}>`).join(', ') || 'Unknown';
        const subject = emailData.subject || '(No subject)';
        
        // Fetch full email body
        let fullBody = emailData.snippet || '';
        if (emailData.body_url) {
          const body = await getEmailBody(emailData.body_url);
          if (body) {
            fullBody = body;
          }
        }
        
        // Create individual comment for this email
        const emailComment = [
          `📧 Email ${i + 1} of ${sortedEmails.length}`,
          ``,
          `📅 Date: ${date}`,
          `👤 From: ${from} ${fromEmail ? `<${fromEmail}>` : ''}`,
          `📨 To: ${to}`,
          `📋 Subject: ${subject}`,
          ``,
          `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
          ``,
          fullBody
        ].join('\n');
        
        const success = await addAsanaComment(taskGid, emailComment);
        
        if (success) {
          addedCount++;
          totalEmailsAdded++;
        }
        
        // Rate limiting between emails
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      
      console.log(`  ✓ Added ${addedCount} email comments`);
      
    } catch (error) {
      console.error(`  ✗ Error: ${error.message}`);
      failed++;
    }
  }
  
  console.log('\n=== SUMMARY ===');
  console.log(`Total tasks processed: ${mappings.length}`);
  console.log(`Total emails added: ${totalEmailsAdded}`);
  console.log(`Skipped (no emails): ${skipped}`);
  console.log(`Failed: ${failed}`);
  
  await pool.end();
}

main().catch(console.error);

