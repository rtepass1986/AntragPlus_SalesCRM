import { PipedriveClient } from './pipedrive';
import { AsanaClient } from './asana';
import { initDatabase, saveSyncMapping, getSyncMapping, updateSyncTime, logSyncAction } from './db';
import { FIELD_MAPPINGS, PIPEDRIVE_STAGE_MAPPING, ASANA_PROJECT_MAPPING, ASANA_SALES_PROJECT_GID, ASANA_CUSTOM_FIELDS, ASANA_LEAD_STATUS, STAGES_TO_SYNC, PIPEDRIVE_TO_ASANA_SECTION } from './mapping';
import { retryWithBackoff, chunkArray } from './util';

export const handler = async (event: any, context: any) => {
  console.log('Starting backfill process...');
  
  try {
    // Initialize database
    await initDatabase();
    
    const pipedriveClient = new PipedriveClient();
    const asanaClient = new AsanaClient();
    
    // Get ALL deals from Pipedrive with pagination (specific stages only)
    console.log('Fetching ALL Pipedrive deals from specific stages...');
    let allDeals: any[] = [];
    let start = 0;
    const limit = 500;
    
    // Fetch all deals with pagination
    while (true) {
      const deals = await pipedriveClient.getDeals(limit, start);
      if (!deals || deals.length === 0) break;
      
      allDeals = allDeals.concat(deals);
      console.log(`Fetched ${deals.length} deals (total so far: ${allDeals.length})`);
      
      if (deals.length < limit) break; // No more deals
      start += limit;
    }
    
    // Filter for only the stages we want to sync: 16,18,9,22,10,13,15,11,12
    // AND exclude lost deals
    const filteredDeals = allDeals.filter(deal => {
      return STAGES_TO_SYNC.includes(deal.stage_id) && deal.status !== 'lost';
    });
    
    console.log(`Found ${allDeals.length} total deals, ${filteredDeals.length} deals in stages to sync (${STAGES_TO_SYNC.join(', ')}) - excluding lost deals`);
    
    // Get Asana projects
    const asanaProjects = await asanaClient.getProjects();
    console.log(`Found ${asanaProjects.length} Asana projects`);
    
    // Process deals in chunks to avoid rate limits
    const dealChunks = chunkArray(allDeals, 10);
    let processedCount = 0;
    let errorCount = 0;
    
    for (const chunk of dealChunks) {
      console.log(`Processing chunk ${processedCount / 10 + 1}/${dealChunks.length}...`);
      
      const promises = chunk.map(async (deal) => {
        try {
          // Check if deal is already synced in database
          const existingMapping = await getSyncMapping(deal.id);
          if (existingMapping) {
            console.log(`Deal ${deal.id} already synced in database, skipping`);
            return;
          }
          
          // Double-check: Search for existing task with this Pipedrive Deal ID in Asana
          // This prevents duplicates if database was cleared but tasks still exist
          try {
            const searchParams = {
              project: ASANA_SALES_PROJECT_GID,
              opt_fields: 'gid,name,custom_fields',
              limit: 100
            };
            const searchResult = await (asanaClient as any).makeRequest('GET', '/tasks', undefined, searchParams);
            const existingTask = searchResult.data?.find((task: any) => {
              const pipedriveIdField = task.custom_fields?.find((cf: any) => cf.gid === ASANA_CUSTOM_FIELDS.PIPEDRIVE_DEAL_ID);
              return pipedriveIdField?.text_value === deal.id.toString();
            });
            
            if (existingTask) {
              console.log(`Deal ${deal.id} already exists in Asana (task ${existingTask.gid}), skipping`);
              // Save the mapping so we don't check again
              await saveSyncMapping({
                pipedriveDealId: deal.id,
                asanaTaskId: existingTask.gid,
                syncDirection: 'bidirectional'
              });
              return;
            }
          } catch (searchError) {
            console.log(`Could not search for existing task for deal ${deal.id}, will create new one`);
          }
          
          // Get the Asana section for this Pipedrive stage
          const asanaSectionGid = PIPEDRIVE_TO_ASANA_SECTION[deal.stage_id];
          const leadStatusGid = PIPEDRIVE_STAGE_MAPPING[deal.stage_id?.toString()] || ASANA_LEAD_STATUS.CONTACTED;
          
          console.log(`Deal ${deal.id} (${deal.title}): Stage ${deal.stage_id} -> Section ${asanaSectionGid}`);
          
          if (!asanaSectionGid) {
            console.error(`No section mapping found for stage ${deal.stage_id}, skipping deal ${deal.id}`);
            return;
          }
          
          // Create Asana task with custom fields and assign to Max
          const taskData: any = {
            name: deal.title || 'Untitled Deal',
            notes: `Synced from Pipedrive\nDeal ID: ${deal.id}\nValue: ${deal.value} ${deal.currency}`,
            due_on: deal.close_time ? new Date(deal.close_time).toISOString().split('T')[0] : undefined,
            completed: deal.status === 'won',
            assignee: '1204409495825768', // Max Schoklitsch (max@antragplus.de)
            custom_fields: {
              [ASANA_CUSTOM_FIELDS.PIPEDRIVE_DEAL_ID]: deal.id.toString(),
              [ASANA_CUSTOM_FIELDS.ESTIMATED_VALUE]: deal.value || 0,
              [ASANA_CUSTOM_FIELDS.LEAD_STATUS]: leadStatusGid,
              [ASANA_CUSTOM_FIELDS.ACCOUNT_NAME]: deal.org_name || deal.person_name || ''
            }
          };
          
          // Create task in the correct section
          const asanaTask = await asanaClient.createTask(taskData, ASANA_SALES_PROJECT_GID, asanaSectionGid);
          console.log(`Created task in section for stage ${deal.stage_id}`);
          
          // Fetch full deal details and add contact information as a comment
          try {
            const fullDeal = await pipedriveClient.getDeal(deal.id);
            const contactInfo: string[] = ['📇 Contact Information from Pipedrive:\n'];
            
            // Person details (person_id is an object in Pipedrive API response)
            if (fullDeal.person_id && typeof fullDeal.person_id === 'object') {
              const person = fullDeal.person_id as any;
              contactInfo.push('👤 Person:');
              contactInfo.push(`  Name: ${person.name || 'N/A'}`);
              if (person.email && person.email.length > 0) {
                const emails = person.email.map((e: any) => e.value).filter(Boolean);
                if (emails.length > 0) {
                  contactInfo.push(`  Email: ${emails.join(', ')}`);
                }
              }
              if (person.phone && person.phone.length > 0) {
                const phones = person.phone.map((p: any) => p.value).filter(Boolean);
                if (phones.length > 0) {
                  contactInfo.push(`  Phone: ${phones.join(', ')}`);
                }
              }
              contactInfo.push('');
            }
            
            // Organization details (org_id is an object in Pipedrive API response)
            if (fullDeal.org_id && typeof fullDeal.org_id === 'object') {
              const org = fullDeal.org_id as any;
              contactInfo.push('🏢 Organization:');
              contactInfo.push(`  Name: ${org.name || 'N/A'}`);
              if (org.address) {
                contactInfo.push(`  Address: ${org.address}`);
              }
              if (org.cc_email) {
                contactInfo.push(`  Email: ${org.cc_email}`);
              }
              if (org.owner_name) {
                contactInfo.push(`  Owner: ${org.owner_name}`);
              }
              contactInfo.push('');
            }
            
            // Add deal owner information
            if (fullDeal.user_id && typeof fullDeal.user_id === 'object') {
              const owner = fullDeal.user_id as any;
              contactInfo.push('👨‍💼 Deal Owner:');
              contactInfo.push(`  Name: ${owner.name || 'N/A'}`);
              if (owner.email) {
                contactInfo.push(`  Email: ${owner.email}`);
              }
            } else if (fullDeal.owner_name) {
              contactInfo.push('👨‍💼 Deal Owner:');
              contactInfo.push(`  Name: ${fullDeal.owner_name}`);
            }
            
            // Only add comment if we have contact info
            if (contactInfo.length > 1) {
              await asanaClient.addComment(asanaTask.gid, contactInfo.join('\n'));
              console.log(`Added contact information comment to task ${asanaTask.gid}`);
            }
          } catch (commentError) {
            console.error(`Error adding contact comment for deal ${deal.id}:`, commentError);
            // Don't fail the whole sync if comment fails
          }
          
          // Fetch and add email correspondence as a separate comment
          try {
            const emails = await pipedriveClient.getDealEmails(deal.id);
            if (emails && emails.length > 0) {
              // Sort emails by date (oldest first)
              const sortedEmails = emails.sort((a: any, b: any) => {
                const dateA = new Date(a.data.message_time).getTime();
                const dateB = new Date(b.data.message_time).getTime();
                return dateA - dateB;
              });
              
              const emailInfo: string[] = ['📧 Email Correspondence:\n'];
              
              sortedEmails.forEach((email: any, index: number) => {
                const emailData = email.data;
                const date = new Date(emailData.message_time).toLocaleString('de-DE');
                const from = emailData.from?.[0]?.name || emailData.from?.[0]?.email_address || 'Unknown';
                const to = emailData.to?.map((t: any) => t.name || t.email_address).join(', ') || 'Unknown';
                const subject = emailData.subject || '(No subject)';
                const snippet = emailData.snippet || '';
                
                emailInfo.push(`\n--- Email ${index + 1} ---`);
                emailInfo.push(`📅 Date: ${date}`);
                emailInfo.push(`👤 From: ${from}`);
                emailInfo.push(`📨 To: ${to}`);
                emailInfo.push(`📋 Subject: ${subject}`);
                if (snippet) {
                  // Limit snippet to 200 characters
                  const shortSnippet = snippet.length > 200 ? snippet.substring(0, 200) + '...' : snippet;
                  emailInfo.push(`💬 Preview: ${shortSnippet}`);
                }
              });
              
              await asanaClient.addComment(asanaTask.gid, emailInfo.join('\n'));
              console.log(`Added ${emails.length} emails to task ${asanaTask.gid}`);
            }
          } catch (emailError) {
            console.error(`Error adding email comment for deal ${deal.id}:`, emailError);
            // Don't fail the whole sync if email comment fails
          }
          
          // Save sync mapping
          await saveSyncMapping({
            pipedriveDealId: deal.id,
            asanaTaskId: asanaTask.gid,
            syncDirection: 'bidirectional'
          });
          
          // Log successful sync
          await logSyncAction(
            deal.id,
            asanaTask.gid,
            'backfill_create',
            'success',
            undefined,
            { deal, task: asanaTask }
          );
          
          console.log(`Successfully synced deal ${deal.id} to task ${asanaTask.gid}`);
          
        } catch (error) {
          console.error(`Error processing deal ${deal.id}:`, error);
          await logSyncAction(
            deal.id,
            null,
            'backfill_create',
            'error',
            error instanceof Error ? error.message : 'Unknown error',
            { deal }
          );
          errorCount++;
        }
      });
      
      await Promise.all(promises);
      processedCount += chunk.length;
      
      // Add delay between chunks to respect rate limits
      if (processedCount < allDeals.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    console.log(`Backfill completed. Processed: ${processedCount}, Errors: ${errorCount}`);
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Backfill completed successfully',
        processed: processedCount,
        errors: errorCount
      })
    };
    
  } catch (error) {
    console.error('Backfill failed:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Backfill failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
};
