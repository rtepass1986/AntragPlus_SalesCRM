#!/usr/bin/env ts-node
/**
 * Enrich Pipedrive Organizations
 * 
 * This script:
 * 1. Fetches all organizations from Pipedrive
 * 2. Identifies empty fields
 * 3. Uses Tavily to find missing website, LinkedIn, contact info
 * 4. Uses LLM to classify industry and estimate size
 * 5. Updates Pipedrive with enriched data
 */

import 'dotenv/config';
import { PipedriveClient } from './sync/pipedrive';
import { TavilyClient } from './utils/tavily';
import { logger } from './utils/logger';
import { callLLM } from './utils/llm';
import { findWebsiteAndContacts } from './search';
import { normalizeGermanPhones } from './utils/text';
import * as fs from 'fs';
import * as path from 'path';

interface EnrichmentResult {
  orgId: number;
  orgName: string;
  status: 'success' | 'partial' | 'skipped' | 'error';
  enrichedFields: string[];
  errors: string[];
  updates: any;
}

async function main() {
  const pipedriveToken = process.env.PIPEDRIVE_API_TOKEN;
  const tavilyKey = process.env.TAVILY_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  if (!pipedriveToken) {
    logger.error('PIPEDRIVE_API_TOKEN not found');
    process.exit(1);
  }
  if (!tavilyKey) {
    logger.error('TAVILY_API_KEY not found');
    process.exit(1);
  }

  const pipedrive = new PipedriveClient(pipedriveToken);
  const tavily = new TavilyClient(tavilyKey);

  // Configuration
  const DRY_RUN = process.env.DRY_RUN === 'true';
  const MAX_ORGS = parseInt(process.env.MAX_ORGS || '100'); // Process 100 by default
  const SKIP_LLM = !openaiKey; // Skip LLM enrichment if no OpenAI key
  const FILTER_STAGE = process.env.FILTER_STAGE || 'disqualified!-Nicht responsive'; // Stage name to filter
  const TARGET_STAGE = process.env.TARGET_STAGE || 'Lead enriched/geprüft'; // Stage to move deals to after enrichment
  const NOTES_TO_DEAL_ONLY = process.env.NOTES_TO_DEAL_ONLY === 'true'; // Add notes only to deals, not org/contact

  if (DRY_RUN) {
    logger.warn('🔴 DRY RUN MODE - No updates will be made to Pipedrive');
  }
  if (SKIP_LLM) {
    logger.warn('⚠️  No OpenAI key - skipping LLM-based enrichment (industry, revenue estimates)');
  }

  logger.info('=== STARTING PIPEDRIVE ENRICHMENT ===');
  logger.info(`🎯 Filtering by stage: "${FILTER_STAGE}"`);
  logger.info(`🎯 Moving enriched deals to: "${TARGET_STAGE}"`);
  if (NOTES_TO_DEAL_ONLY) {
    logger.info(`📝 Notes will be added to DEALS ONLY (not organization/contact)`);
  }
  
  // Find the stages
  logger.info('Fetching stages...');
  const stages = await pipedrive.getStages();
  const sourceStage = stages.find(s => s.name === FILTER_STAGE);
  const destinationStage = stages.find(s => s.name === TARGET_STAGE);
  
  if (!sourceStage) {
    logger.error(`Source stage "${FILTER_STAGE}" not found!`);
    logger.info('Available stages:');
    stages.forEach(s => logger.info(`  - ${s.name} (ID: ${s.id})`));
    process.exit(1);
  }
  
  if (!destinationStage) {
    logger.error(`Target stage "${TARGET_STAGE}" not found!`);
    logger.info('Available stages:');
    stages.forEach(s => logger.info(`  - ${s.name} (ID: ${s.id})`));
    process.exit(1);
  }
  
  logger.info(`✅ Found source stage: "${sourceStage.name}" (ID: ${sourceStage.id})`);
  logger.info(`✅ Found target stage: "${destinationStage.name}" (ID: ${destinationStage.id})`);
  
  // Fetch deals in this stage
  logger.info('Fetching deals...');
  const allDeals = await pipedrive.getAllDeals();
  const dealsInStage = allDeals.filter(deal => 
    deal.stage_id === sourceStage.id && 
    deal.status !== 'lost' // Skip lost deals
  );
  logger.info(`Total deals in stage "${FILTER_STAGE}": ${dealsInStage.length}`);
  
  // Map organizations to their deals
  const orgToDeal = new Map<number, number>();
  dealsInStage.forEach(deal => {
    let orgId: number | null = null;
    if (deal.org_id && typeof deal.org_id === 'object' && deal.org_id.value) {
      orgId = deal.org_id.value;
    } else if (deal.org_id && typeof deal.org_id === 'number') {
      orgId = deal.org_id;
    }
    if (orgId) {
      orgToDeal.set(orgId, deal.id);
    }
  });
  
  logger.info(`Unique organizations in this stage: ${orgToDeal.size}`);
  
  // Fetch organizations
  logger.info('Fetching organizations...');
  const allOrgs = await pipedrive.getAllOrganizations();
  const orgsInStage = allOrgs.filter(org => orgToDeal.has(org.id));
  logger.info(`Organizations to process: ${orgsInStage.length}`);

  // Filter organizations that need enrichment
  const orgsToEnrich = orgsInStage
    .filter(org => needsEnrichment(org))
    .slice(0, MAX_ORGS);

  logger.info(`Organizations needing enrichment: ${orgsToEnrich.length} (processing max ${MAX_ORGS})`);

  if (orgsToEnrich.length === 0) {
    logger.info('✅ No organizations need enrichment!');
    return;
  }

  // Enrich each organization
  const results: EnrichmentResult[] = [];
  let successCount = 0;
  let partialCount = 0;
  let errorCount = 0;

  for (let i = 0; i < orgsToEnrich.length; i++) {
    const org = orgsToEnrich[i];
    const progress = `[${i + 1}/${orgsToEnrich.length}]`;
    
    logger.info(`\n${progress} Processing: ${org.name} (ID: ${org.id})`);

    try {
      const result = await enrichOrganization(org, tavily, openaiKey, SKIP_LLM);
      
      if (result.enrichedFields.length > 0 && !DRY_RUN) {
        await pipedrive.updateOrganization(org.id, result.updates);
        logger.info(`${progress} ✅ Updated ${result.enrichedFields.length} fields for ${org.name}`);
        
        // Get contact info and deal ID
        const description = (result as any).description;
        const contactInfo = (result as any).contactInfo;
        const dealId = orgToDeal.get(org.id);
        
        // 1. Update Person (contact) with emails and phones
        if (contactInfo && (contactInfo.emails.length > 0 || contactInfo.phones.length > 0)) {
          try {
            const existingPersons = await pipedrive.getPersonsByOrganization(org.id);
            
            if (existingPersons.length > 0) {
              // Update first existing contact
              const person = existingPersons[0];
              const updateData: any = {};
              
              // Check if email is truly empty (not just empty array, but also empty values)
              const hasRealEmail = person.email && person.email.length > 0 && 
                                   person.email.some((e: any) => e.value && e.value.trim() !== '');
              
              if (contactInfo.emails.length > 0 && !hasRealEmail) {
                // Format emails for Pipedrive
                updateData.email = contactInfo.emails.map((email: string, idx: number) => ({
                  value: email,
                  primary: idx === 0,
                  label: 'work'
                }));
              }
              
              // Check if phone is truly empty (not just empty array, but also empty values)
              const hasRealPhone = person.phone && person.phone.length > 0 && 
                                   person.phone.some((p: any) => p.value && p.value.trim() !== '');
              
              if (contactInfo.phones.length > 0 && !hasRealPhone) {
                // Normalize to German format and format for Pipedrive
                const normalizedPhones = normalizeGermanPhones(contactInfo.phones);
                if (normalizedPhones.length > 0) {
                  updateData.phone = normalizedPhones.map((phone: string, idx: number) => ({
                    value: phone,
                    primary: idx === 0,
                    label: 'work'
                  }));
                }
              }
              
              if (Object.keys(updateData).length > 0) {
                await pipedrive.updatePerson(person.id, updateData);
                logger.info(`${progress} 👤 Updated contact: ${person.name}`);
              } else {
                logger.info(`${progress} ℹ️  Contact already has email/phone, skipping`);
              }
            } else {
              logger.warn(`${progress} ⚠️  No existing contact found for organization, skipping contact update`);
            }
          } catch (error: any) {
            logger.error(`${progress} ❌ Failed to update contact: ${error.message}`);
          }
        }
        
        // 2. Create note with description and contact info
        if (description || contactInfo) {
          let noteContent = '';
          
          if (description) {
            noteContent += `**Beschreibung:**\n${description}\n\n`;
          }
          
          if (contactInfo) {
            noteContent += `**Kontaktinformationen:**\n`;
            if (contactInfo.emails && contactInfo.emails.length > 0) {
              noteContent += `📧 Email: ${contactInfo.emails.join(', ')}\n`;
            }
            if (contactInfo.phones && contactInfo.phones.length > 0) {
              // Normalize phones for display in note
              const normalizedPhones = normalizeGermanPhones(contactInfo.phones);
              noteContent += `📞 Telefon: ${normalizedPhones.join(', ')}\n`;
            }
          }
          
          if (noteContent) {
            if (NOTES_TO_DEAL_ONLY) {
              // Only add note to deal
              if (dealId) {
                await pipedrive.addNoteToDeal(dealId, noteContent.trim());
                logger.info(`${progress} 📝 Added note to deal ONLY`);
              }
            } else {
              // Add note to organization
              await pipedrive.addNoteToOrganization(org.id, noteContent.trim());
              logger.info(`${progress} 📝 Added note to organization`);
              
              // Also add note to deal if deal exists
              if (dealId) {
                await pipedrive.addNoteToDeal(dealId, noteContent.trim());
                logger.info(`${progress} 📝 Added note to deal`);
              }
            }
          }
        }
        
        // 3. Move deal to target stage
        if (dealId && result.enrichedFields.length > 0) {
          try {
            await pipedrive.updateDeal(dealId, { stage_id: destinationStage.id });
            logger.info(`${progress} 🎯 Moved deal to "${TARGET_STAGE}" stage`);
          } catch (error: any) {
            logger.error(`${progress} ❌ Failed to move deal: ${error.message}`);
          }
        }
      } else if (result.enrichedFields.length > 0 && DRY_RUN) {
        logger.info(`${progress} 🔍 [DRY RUN] Would update: ${result.enrichedFields.join(', ')}`);
        
        const contactInfo = (result as any).contactInfo;
        const dealId = orgToDeal.get(org.id);
        if (contactInfo) {
          logger.info(`${progress} 🔍 [DRY RUN] Would update existing contact with ${contactInfo.emails.length} emails, ${contactInfo.phones.length} phones`);
        }
        if (dealId) {
          logger.info(`${progress} 🔍 [DRY RUN] Would add note to deal (ID: ${dealId})`);
        }
      }

      results.push(result);

      if (result.status === 'success') successCount++;
      else if (result.status === 'partial') partialCount++;
      else if (result.status === 'error') errorCount++;

      // Rate limiting: pause between requests
      if (i < orgsToEnrich.length - 1) {
        await sleep(2000); // 2 seconds between orgs
      }
    } catch (error: any) {
      logger.error({ error: error.message, orgId: org.id }, 'Failed to enrich organization');
      results.push({
        orgId: org.id,
        orgName: org.name,
        status: 'error',
        enrichedFields: [],
        errors: [error.message],
        updates: {},
      });
      errorCount++;
    }
  }

  // Save results
  const reportPath = path.join(__dirname, 'reports', `enrichment-${Date.now()}.json`);
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));

  // Print summary
  logger.info('\n' + '='.repeat(80));
  logger.info('ENRICHMENT SUMMARY');
  logger.info('='.repeat(80));
  logger.info(`Total processed: ${orgsToEnrich.length}`);
  logger.info(`✅ Fully enriched: ${successCount}`);
  logger.info(`⚠️  Partially enriched: ${partialCount}`);
  logger.info(`❌ Errors: ${errorCount}`);
  logger.info(`📄 Report saved to: ${reportPath}`);
  logger.info('='.repeat(80));
}

/**
 * Check if organization needs enrichment
 */
function needsEnrichment(org: any): boolean {
  const taetigkeitsfeldKey = 'd0ff2ebd4d3c12b3f1faad65b409a8e578d657a3';
  
  return (
    !org.website ||
    !org.industry ||
    !org.employee_count ||
    !org.linkedin ||
    !org.address ||
    !org[taetigkeitsfeldKey] ||
    !org.notes_count // No notes = needs description
  );
}

/**
 * Enrich a single organization
 */
async function enrichOrganization(
  org: any,
  tavily: TavilyClient,
  openaiKey: string | undefined,
  skipLLM: boolean
): Promise<EnrichmentResult> {
  const result: EnrichmentResult = {
    orgId: org.id,
    orgName: org.name,
    status: 'skipped',
    enrichedFields: [],
    errors: [],
    updates: {},
  };

  const updates: any = {};
  const taetigkeitsfeldKey = 'd0ff2ebd4d3c12b3f1faad65b409a8e578d657a3';
  
  let websiteForScraping = org.website;

  // 1. Find website if missing
  if (!org.website) {
    logger.info(`  🔍 Searching for website...`);
    try {
      const website = await tavily.searchDomain(org.name);
      if (website) {
        updates.website = website;
        websiteForScraping = website;
        result.enrichedFields.push('website');
        logger.info(`  ✅ Found website: ${website}`);
      } else {
        logger.info(`  ⚠️  Website not found`);
      }
    } catch (error: any) {
      result.errors.push(`Website search failed: ${error.message}`);
    }
  }

  // 2. Extract contact info and address from website
  if (websiteForScraping && (!org.address || org.notes_count === 0)) {
    logger.info(`  🔍 Scraping website for contacts and address...`);
    try {
      const contactData = await findWebsiteAndContacts(org.name, websiteForScraping);
      
      // Address
      if (contactData.address && !org.address) {
        updates.address = contactData.address;
        result.enrichedFields.push('address');
        logger.info(`  ✅ Found address: ${contactData.address}`);
      }
      
      // Store contact info for note creation
      if (contactData.emails.length > 0 || contactData.phones.length > 0) {
        result.enrichedFields.push('contact_info');
        logger.info(`  ✅ Found ${contactData.emails.length} emails, ${contactData.phones.length} phones`);
        
        // We'll add this to the note later
        (result as any).contactInfo = {
          emails: contactData.emails,
          phones: contactData.phones,
        };
      }
    } catch (error: any) {
      result.errors.push(`Website scraping failed: ${error.message}`);
      logger.warn(`  ⚠️  Website scraping failed: ${error.message}`);
    }
  }

  // 3. Find LinkedIn if missing
  if (!org.linkedin) {
    logger.info(`  🔍 Searching for LinkedIn...`);
    try {
      const linkedInQuery = `${org.name} LinkedIn company page site:linkedin.com`;
      const results = await tavily.search(linkedInQuery, 3);
      const linkedInUrl = results.find(r => r.url.includes('linkedin.com/company/'));
      if (linkedInUrl) {
        updates.linkedin = linkedInUrl.url;
        result.enrichedFields.push('linkedin');
        logger.info(`  ✅ Found LinkedIn: ${linkedInUrl.url}`);
      } else {
        logger.info(`  ⚠️  LinkedIn not found`);
      }
    } catch (error: any) {
      result.errors.push(`LinkedIn search failed: ${error.message}`);
    }
  }

  // 4. Research company for LLM enrichment
  let researchContext = '';
  if (!skipLLM && (!org.industry || !org.employee_count || !org[taetigkeitsfeldKey] || org.notes_count === 0)) {
    logger.info(`  🔍 Researching company...`);
    try {
      researchContext = await tavily.researchCompany(org.name, websiteForScraping || org.website);
      if (researchContext) {
        logger.info(`  ✅ Research complete (${researchContext.length} chars)`);
      }
    } catch (error: any) {
      result.errors.push(`Research failed: ${error.message}`);
    }
  }

  // 5. LLM-based enrichment (industry, employee count, revenue, field, description)
  if (!skipLLM && researchContext && openaiKey) {
    logger.info(`  🤖 Running LLM enrichment...`);
    try {
      const llmEnrichment = await enrichWithLLM(org.name, researchContext, openaiKey);
      
      if (llmEnrichment.industry && !org.industry) {
        // Map text to Pipedrive industry option IDs
        const industryMap: Record<string, string> = {
          'Bildung': '5',
          'Soziales': '11', // Krankenhäuser und Gesundheitswesen
          'Umwelt': '13', // Öl, Gas und Bergbau - closest match
          'Jugend': '5', // Bildung
          'Kultur': '6', // Unterhaltungsbranche
          'Gesundheit': '11',
          'Sport': '6',
        };
        
        const optionId = industryMap[llmEnrichment.industry];
        if (optionId) {
          updates.industry = optionId;
          result.enrichedFields.push('industry');
          logger.info(`  ✅ Industry: ${llmEnrichment.industry} (ID: ${optionId})`);
        } else {
          logger.warn(`  ⚠️  Industry "${llmEnrichment.industry}" not mapped, skipping`);
        }
      }
      
      if (llmEnrichment.employee_count && !org.employee_count) {
        updates.employee_count = llmEnrichment.employee_count;
        result.enrichedFields.push('employee_count');
        logger.info(`  ✅ Employee count: ${llmEnrichment.employee_count}`);
      }
      
      if (llmEnrichment.annual_revenue && !org.annual_revenue) {
        updates.annual_revenue = llmEnrichment.annual_revenue;
        result.enrichedFields.push('annual_revenue');
        logger.info(`  ✅ Annual revenue: ${llmEnrichment.annual_revenue}`);
      }
      
      if (llmEnrichment.taetigkeitsfeld && !org[taetigkeitsfeldKey]) {
        // Map text to Pipedrive option IDs
        const tatigkeitsfeldMap: Record<string, string> = {
          'Kinder und Jugend': '45',
          'Kinder- und Jugendhilfe': '45',
          'Soziales': '46',
          'Soziale Arbeit': '46',
          'Umwelt und Nachhaltigkeit': '47',
          'Umwelt- und Klimaschutz': '47',
          'Gesundheit': '46', // Map to Soziale Arbeit
          'Kultur und Kunst': '46', // Map to Soziale Arbeit
          'Sport': '46',
          'Integration': '46',
          'Entwicklungshilfe': '46',
          'Wissenschaft': '46',
          'Bildung': '45', // Map to Kinder- und Jugendhilfe (education for youth)
        };
        
        const optionId = tatigkeitsfeldMap[llmEnrichment.taetigkeitsfeld];
        if (optionId) {
          updates[taetigkeitsfeldKey] = optionId;
          result.enrichedFields.push('taetigkeitsfeld');
          logger.info(`  ✅ Tätigkeitsfeld: ${llmEnrichment.taetigkeitsfeld} (ID: ${optionId})`);
        } else {
          logger.warn(`  ⚠️  Tätigkeitsfeld "${llmEnrichment.taetigkeitsfeld}" not mapped, skipping`);
        }
      }
      
      // Store description for note creation
      if (llmEnrichment.description && org.notes_count === 0) {
        (result as any).description = llmEnrichment.description;
        result.enrichedFields.push('description');
        logger.info(`  ✅ Generated description (${llmEnrichment.description.length} chars)`);
      }
    } catch (error: any) {
      result.errors.push(`LLM enrichment failed: ${error.message}`);
      logger.error(`  ❌ LLM enrichment failed: ${error.message}`);
    }
  }

  // Determine status
  result.updates = updates;
  if (result.enrichedFields.length === 0) {
    result.status = 'skipped';
  } else if (result.errors.length > 0) {
    result.status = 'partial';
  } else {
    result.status = 'success';
  }

  return result;
}

/**
 * Use LLM to enrich organization data
 */
async function enrichWithLLM(
  orgName: string,
  researchContext: string,
  openaiKey: string
): Promise<{
  industry: string | null;
  employee_count: number | null;
  annual_revenue: number | null;
  taetigkeitsfeld: string | null;
  description: string | null;
}> {
  const prompt = `You are analyzing a German nonprofit organization for data enrichment.

Organization Name: ${orgName}

Research Context:
${researchContext.slice(0, 3500)}

Based on this information, provide:
1. Industry/sector (e.g., "Bildung", "Soziales", "Umwelt", "Jugend", "Kultur", etc.)
2. Estimated employee count (full-time equivalent, or null if unknown)
3. Estimated annual revenue in EUR (or null if unknown)
4. Tätigkeitsfeld (activity field) - Choose ONE most relevant: "Bildung", "Soziales", "Kinder und Jugend", "Umwelt und Nachhaltigkeit", "Gesundheit", "Kultur und Kunst", "Sport", "Integration", "Entwicklungshilfe", "Wissenschaft", or null if unknown
5. Description (2-3 sentences in German summarizing what the organization does and their mission)

Return ONLY valid JSON with this exact structure:
{
  "industry": "string or null",
  "employee_count": number or null,
  "annual_revenue": number or null,
  "taetigkeitsfeld": "string or null",
  "description": "string or null"
}`;

  const response = await callLLM(prompt, {
    model: 'gpt-4o-mini',
    temperature: 0.2,
    max_tokens: 500,
  });

  try {
    const parsed = JSON.parse(response);
    return {
      industry: parsed.industry || null,
      employee_count: parsed.employee_count || null,
      annual_revenue: parsed.annual_revenue || null,
      taetigkeitsfeld: parsed.taetigkeitsfeld || null,
      description: parsed.description || null,
    };
  } catch (error) {
    logger.error({ response }, 'Failed to parse LLM response');
    return { 
      industry: null, 
      employee_count: null, 
      annual_revenue: null,
      taetigkeitsfeld: null,
      description: null,
    };
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

main().catch((error) => {
  logger.error({ error: error.message }, 'Enrichment failed');
  process.exit(1);
});

