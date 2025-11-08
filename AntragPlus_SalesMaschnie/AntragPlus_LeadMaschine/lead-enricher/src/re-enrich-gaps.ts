#!/usr/bin/env ts-node
/**
 * Re-enrich to fill missing deal notes and phone numbers
 */

import 'dotenv/config';
import { PipedriveClient } from './sync/pipedrive';
import { TavilyClient } from './utils/tavily';
import { logger } from './utils/logger';
import { findWebsiteAndContacts } from './search';
import { normalizeGermanPhones } from './utils/text';
import { callLLM } from './utils/llm';

const TATIGKEITSFELD_KEY = 'd0ff2ebd4d3c12b3f1faad65b409a8e578d657a3';
const STAGE_NAME = process.env.STAGE || 'Kinder und Jugendhilfe_only';

async function main() {
  const pipedriveToken = process.env.PIPEDRIVE_API_TOKEN;
  const tavilyKey = process.env.TAVILY_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  if (!pipedriveToken || !tavilyKey || !openaiKey) {
    logger.error('Missing required API tokens');
    process.exit(1);
  }

  const pipedrive = new PipedriveClient(pipedriveToken);
  const tavily = new TavilyClient(tavilyKey);

  logger.info('=== RE-ENRICHING GAPS ===');
  logger.info(`Stage: "${STAGE_NAME}"`);
  logger.info('Targets: Missing deal notes + missing phone numbers');

  // Find stage
  const stages = await pipedrive.getStages();
  const targetStage = stages.find(s => s.name === STAGE_NAME);

  if (!targetStage) {
    logger.error(`Stage "${STAGE_NAME}" not found!`);
    process.exit(1);
  }

  // Fetch deals
  const allDeals = await pipedrive.getAllDeals();
  const dealsInStage = allDeals.filter(deal => 
    deal.stage_id === targetStage.id && 
    deal.status !== 'lost' && 
    deal.status !== 'deleted'
  );
  logger.info(`Total deals in stage (excluding lost/deleted): ${dealsInStage.length}`);

  // Fetch organizations
  const allOrgs = await pipedrive.getAllOrganizations();
  const orgMap = new Map(allOrgs.map(org => [org.id, org]));

  let notesAdded = 0;
  let phonesAdded = 0;
  let errors = 0;

  for (let i = 0; i < dealsInStage.length; i++) {
    const deal = dealsInStage[i];
    const progress = `[${i + 1}/${dealsInStage.length}]`;

    let orgId: number | null = null;
    if (deal.org_id && typeof deal.org_id === 'object' && deal.org_id.value) {
      orgId = deal.org_id.value;
    } else if (deal.org_id && typeof deal.org_id === 'number') {
      orgId = deal.org_id;
    }

    if (!orgId) continue;

    const org = orgMap.get(orgId);
    if (!org) continue;

    try {
      logger.info(`${progress} Processing: ${org.name}`);

      // Check if deal needs notes
      const needsNotes = !deal.notes_count || deal.notes_count === 0;

      // Check if contact needs phone
      const persons = await pipedrive.getPersonsByOrganization(orgId);
      const needsPhone = persons.length > 0 && 
        !(persons[0].phone && persons[0].phone.length > 0 && 
          persons[0].phone.some((p: any) => p.value && p.value.trim() !== ''));

      if (!needsNotes && !needsPhone) {
        logger.info(`${progress} ✅ Already complete, skipping`);
        continue;
      }

      let noteContent = '';
      let contactPhones: string[] = [];

      // If needs notes or phones, scrape website
      if ((needsNotes || needsPhone) && org.website) {
        logger.info(`${progress} 🔍 Scraping website for contacts...`);
        const data = await findWebsiteAndContacts(org.name, org.website);
        
        if (data.phones.length > 0) {
          contactPhones = normalizeGermanPhones(data.phones);
          logger.info(`${progress} ✅ Found ${contactPhones.length} phones`);
        }

        // Generate AI description for notes
        if (needsNotes) {
          logger.info(`${progress} 🤖 Generating description...`);
          const context = await tavily.researchCompany(org.name, org.website);
          
          if (context) {
            const prompt = `You are analyzing a German nonprofit organization.

Organization: ${org.name}
Website: ${org.website}

Research:
${context.slice(0, 3000)}

Generate a concise 2-3 sentence German description of the organization's mission and activities.

Return ONLY the description text, no JSON, no formatting.`;

            try {
              const description = await callLLM(prompt, { model: 'gpt-4o-mini', temperature: 0.3 });
              
              noteContent = `**Beschreibung:**\n${description.trim()}\n\n`;
              
              if (data.emails.length > 0) {
                noteContent += `**Kontaktinformationen:**\n`;
                noteContent += `📧 Email: ${data.emails.join(', ')}\n`;
              }
              
              if (contactPhones.length > 0) {
                noteContent += `📞 Telefon: ${contactPhones.join(', ')}\n`;
              }
            } catch (error: any) {
              logger.error(`${progress} ❌ LLM error: ${error.message}`);
            }
          }
        }
      }

      // Add note to deal
      if (needsNotes && noteContent) {
        try {
          await pipedrive.addNoteToDeal(deal.id, noteContent.trim());
          logger.info(`${progress} 📝 Added note to deal`);
          notesAdded++;
        } catch (error: any) {
          logger.error(`${progress} ❌ Failed to add note: ${error.message}`);
          errors++;
        }
      }

      // Update contact with phone
      if (needsPhone && contactPhones.length > 0 && persons.length > 0) {
        try {
          const updateData: any = {
            phone: contactPhones.map((phone: string, idx: number) => ({
              value: phone,
              primary: idx === 0,
              label: 'work'
            }))
          };
          await pipedrive.updatePerson(persons[0].id, updateData);
          logger.info(`${progress} 📞 Added ${contactPhones.length} phones to contact`);
          phonesAdded++;
        } catch (error: any) {
          logger.error(`${progress} ❌ Failed to add phones: ${error.message}`);
          errors++;
        }
      }

      // Delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));

    } catch (error: any) {
      logger.error(`${progress} ❌ Error: ${error.message}`);
      errors++;
    }
  }

  logger.info('\n' + '='.repeat(80));
  logger.info('RE-ENRICHMENT SUMMARY');
  logger.info('='.repeat(80));
  logger.info(`Stage: "${STAGE_NAME}"`);
  logger.info(`Total deals processed: ${dealsInStage.length}`);
  logger.info(`📝 Deal notes added: ${notesAdded}`);
  logger.info(`📞 Contact phones added: ${phonesAdded}`);
  logger.info(`❌ Errors: ${errors}`);
  logger.info('='.repeat(80));
}

main().catch((error) => {
  logger.error({ error: error.message }, 'Script failed');
  process.exit(1);
});

