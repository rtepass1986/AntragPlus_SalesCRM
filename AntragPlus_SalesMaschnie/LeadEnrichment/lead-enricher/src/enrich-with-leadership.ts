#!/usr/bin/env ts-node
/**
 * Enhanced Pipedrive Enrichment with Leadership Extraction
 * 
 * This script enriches organizations with:
 * 1. Standard data (website, LinkedIn, industry)
 * 2. LEADERSHIP TEAM (Vorstand, Geschäftsführung, etc.)
 * 3. Decision-maker identification
 * 4. Contact prioritization
 */

import 'dotenv/config';
import { PipedriveClient } from './sync/pipedrive';
import { TavilyClient } from './utils/tavily';
import { logger } from './utils/logger';
import { 
  extractLeadership, 
  buildOrganizationStructure,
  identifyPrimaryDecisionMaker,
  identifySoftwareBuyers 
} from './extract-leadership';
import { callLLM } from './utils/llm';
import { findWebsiteAndContacts } from './search';
import { normalizeGermanPhones } from './utils/text';
import type { OrganizationStructure, LeadershipRole } from './utils/schemas';
import * as fs from 'fs';
import * as path from 'path';

interface EnhancedEnrichmentResult {
  orgId: number;
  orgName: string;
  status: 'success' | 'partial' | 'error';
  
  // Standard enrichment
  standardFields: string[];
  
  // Leadership enrichment
  leadership: LeadershipRole[];
  primaryDecisionMaker: LeadershipRole | null;
  softwareBuyers: LeadershipRole[];
  
  // Organization structure
  orgStructure: OrganizationStructure | null;
  
  // Organization metadata (from extraction)
  legalForm: string | null;
  estimatedStaff: number | null;
  
  // AI-generated description and context
  description?: string; // 2-3 sentence German description
  flagshipProjects?: string[]; // Key projects/initiatives
  arbeitsbereiche?: string[]; // Work areas/fields of activity
  
  // Quality metrics
  completenessScore: number;
  confidence: number;
  
  // Note content (for review)
  noteContent?: string;
  
  errors: string[];
  updates: any;
}

async function main() {
  const pipedriveToken = process.env.PIPEDRIVE_API_TOKEN;
  const tavilyKey = process.env.TAVILY_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  if (!pipedriveToken || !tavilyKey || !openaiKey) {
    logger.error('Missing required API keys');
    process.exit(1);
  }

  const pipedrive = new PipedriveClient(pipedriveToken);
  const tavily = new TavilyClient(tavilyKey);

  // Configuration
  const DRY_RUN = process.env.DRY_RUN === 'true';
  const MAX_ORGS = parseInt(process.env.MAX_ORGS || '50');
  const FILTER_STAGE = process.env.FILTER_STAGE || 'Qualified Lead generiert';
  const TARGET_STAGE = process.env.TARGET_STAGE || 'Lead enriched/geprüft';
  // SAFE DEFAULT: Deals are NOT moved unless explicitly enabled
  const SKIP_MOVE = process.env.SKIP_MOVE !== 'false'; // Only move if explicitly set to 'false'

  if (DRY_RUN) {
    logger.warn('🔴 DRY RUN MODE - No updates will be made');
  }

  logger.info('=== ENHANCED PIPEDRIVE ENRICHMENT WITH LEADERSHIP ===');
  logger.info(`🎯 Source stage: "${FILTER_STAGE}"`);
  logger.info(`🎯 Target stage: "${TARGET_STAGE}"`);
  logger.info(`👥 Leadership extraction: ENABLED`);
  if (SKIP_MOVE) {
    logger.info(`⏸️  Deal movement: DISABLED (deals will stay in current stage) ✅ SAFE MODE`);
  } else {
    logger.warn(`⚠️  Deal movement: ENABLED (deals will move to "${TARGET_STAGE}")`);
  }
  
  // Fetch stages and deals
  const stages = await pipedrive.getStages();
  const sourceStage = stages.find(s => s.name === FILTER_STAGE);
  const destinationStage = stages.find(s => s.name === TARGET_STAGE);
  
  if (!sourceStage || !destinationStage) {
    logger.error('Required stages not found');
    process.exit(1);
  }
  
  logger.info(`✅ Found source stage: "${sourceStage.name}" (ID: ${sourceStage.id})`);
  logger.info(`✅ Found target stage: "${destinationStage.name}" (ID: ${destinationStage.id})`);
  
  // Fetch deals
  const allDeals = await pipedrive.getAllDeals();
  const dealsInStage = allDeals.filter(d => 
    d.stage_id === sourceStage.id && 
    d.status !== 'lost' && 
    d.status !== 'deleted'
  );
  logger.info(`Deals in stage (excluding lost/deleted): ${dealsInStage.length}`);
  
  // Map orgs to deals
  const orgToDeal = new Map<number, number>();
  dealsInStage.forEach(deal => {
    const orgId = extractOrgId(deal);
    if (orgId) orgToDeal.set(orgId, deal.id);
  });
  
  // Fetch organizations
  const allOrgs = await pipedrive.getAllOrganizations();
  const orgsToEnrich = allOrgs
    .filter(org => orgToDeal.has(org.id))
    .filter(org => needsEnrichment(org))
    .slice(0, MAX_ORGS);

  logger.info(`Organizations to enrich: ${orgsToEnrich.length}`);

  if (orgsToEnrich.length === 0) {
    logger.info('✅ No organizations need enrichment');
    return;
  }

  // Enrich with leadership
  const results: EnhancedEnrichmentResult[] = [];
  let successCount = 0;
  let partialCount = 0;
  let errorCount = 0;

  for (let i = 0; i < orgsToEnrich.length; i++) {
    const org = orgsToEnrich[i];
    const progress = `[${i + 1}/${orgsToEnrich.length}]`;
    
    logger.info(`\n${'='.repeat(80)}`);
    logger.info(`${progress} 🏢 ${org.name} (ID: ${org.id})`);
    logger.info('='.repeat(80));

    try {
      const result = await enrichOrganizationWithLeadership(
        org,
        tavily,
        openaiKey,
        pipedrive
      );
      
      // Update Pipedrive
      if (!DRY_RUN && result.status !== 'error') {
        // 1. Update organization fields
        if (Object.keys(result.updates).length > 0) {
          await pipedrive.updateOrganization(org.id, result.updates);
          logger.info(`${progress} ✅ Updated ${result.standardFields.length} standard fields`);
        }
        
        // 2. Create Person records for leadership
        if (result.leadership.length > 0) {
          await createLeadershipContacts(pipedrive, org.id, result.leadership, progress);
        }
        
        // 3. Create comprehensive note with ALL enriched data
        const noteContent = buildComprehensiveNote(result, org);
        
        // Add note to organization
        await pipedrive.addNoteToOrganization(org.id, noteContent);
        
        // ALWAYS add note to deal (with all enrichment data)
        const dealId = orgToDeal.get(org.id);
        if (dealId) {
          await pipedrive.addNoteToDeal(dealId, noteContent);
          logger.info(`${progress} 📝 Added comprehensive enrichment note to organization & deal`);
          
          // 4. Move deal to target stage (if enabled)
          if (!SKIP_MOVE) {
            await pipedrive.updateDeal(dealId, { stage_id: destinationStage.id });
            logger.info(`${progress} 🎯 Moved deal to "${TARGET_STAGE}"`);
          } else {
            logger.info(`${progress} ⏸️  Deal kept in current stage (SKIP_MOVE enabled)`);
          }
        } else {
          logger.info(`${progress} 📝 Added comprehensive enrichment note to organization (no deal found)`);
        }
      } else if (DRY_RUN) {
        logger.info(`${progress} 🔍 [DRY RUN] Would update with ${result.leadership.length} leadership contacts`);
        if (result.primaryDecisionMaker) {
          logger.info(`${progress} 🔍 [DRY RUN] Primary decision maker: ${result.primaryDecisionMaker.name} (${result.primaryDecisionMaker.role_display})`);
        }
        
        // Show what note would be added
        const dealId = orgToDeal.get(org.id);
        const noteContent = buildComprehensiveNote(result, org);
        result.noteContent = noteContent; // Save to result for review
        logger.info(`${progress} 🔍 [DRY RUN] Would add comprehensive note (${noteContent.length} chars) to organization & deal`);
        if (dealId && !SKIP_MOVE) {
          logger.info(`${progress} 🔍 [DRY RUN] Would move deal (ID: ${dealId}) to "${TARGET_STAGE}"`);
        } else if (dealId && SKIP_MOVE) {
          logger.info(`${progress} 🔍 [DRY RUN] Would keep deal in current stage (SKIP_MOVE enabled)`);
        }
      }

      // Save note content to result for review
      if (!result.noteContent) {
        result.noteContent = buildComprehensiveNote(result, org);
      }

      results.push(result);

      if (result.status === 'success') successCount++;
      else if (result.status === 'partial') partialCount++;
      else errorCount++;

      // Rate limiting
      if (i < orgsToEnrich.length - 1) {
        await sleep(3000); // 3 seconds between orgs (more intensive processing)
      }
      
    } catch (error: any) {
      logger.error({ error: error.message, orgId: org.id }, 'Enrichment failed');
      errorCount++;
    }
  }

  // Save results
  const reportPath = path.join(__dirname, 'reports', `leadership-enrichment-${Date.now()}.json`);
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));

  // Print summary
  printSummary(results, successCount, partialCount, errorCount, reportPath);
}

/**
 * Enhanced enrichment with leadership extraction
 */
async function enrichOrganizationWithLeadership(
  org: any,
  tavily: TavilyClient,
  openaiKey: string,
  pipedrive: PipedriveClient
): Promise<EnhancedEnrichmentResult> {
  
  const result: EnhancedEnrichmentResult = {
    orgId: org.id,
    orgName: org.name,
    status: 'partial',
    standardFields: [],
    leadership: [],
    primaryDecisionMaker: null,
    softwareBuyers: [],
    orgStructure: null,
    legalForm: null,
    estimatedStaff: null,
    completenessScore: 0,
    confidence: 0,
    errors: [],
    updates: {},
  };

  const updates: any = {};
  let websiteUrl = org.website;

  // STEP 1: Find website if missing
  if (!websiteUrl) {
    logger.info('  🔍 Searching for website...');
    try {
      websiteUrl = await tavily.searchDomain(org.name);
      if (websiteUrl) {
        updates.website = websiteUrl;
        result.standardFields.push('website');
        logger.info(`  ✅ Found website: ${websiteUrl}`);
      }
    } catch (error: any) {
      result.errors.push(`Website search failed: ${error.message}`);
    }
  }

  if (!websiteUrl) {
    logger.warn('  ⚠️  No website found - cannot extract leadership');
    result.status = 'error';
    result.errors.push('No website available');
    return result;
  }

  // STEP 2: Extract contact info and address (standard enrichment)
  logger.info('  🔍 Scraping website for contacts...');
  try {
    const contactData = await findWebsiteAndContacts(org.name, websiteUrl);
    
    if (contactData.address && !org.address) {
      updates.address = contactData.address;
      result.standardFields.push('address');
      logger.info(`  ✅ Found address: ${contactData.address}`);
    }
    
    if (contactData.emails.length > 0 || contactData.phones.length > 0) {
      result.standardFields.push('contact_info');
      logger.info(`  ✅ Found ${contactData.emails.length} emails, ${contactData.phones.length} phones`);
      
      // Store contact info for notes and Person records
      (result as any).contactInfo = {
        emails: contactData.emails,
        phones: contactData.phones,
      };
    }
  } catch (error: any) {
    logger.warn(`  ⚠️  Website scraping failed: ${error.message}`);
  }

  // STEP 3: Extract leadership (MAIN FEATURE)
  logger.info('  👥 Extracting leadership team...');
  try {
    const leadershipExtraction = await extractLeadership(
      org.name,
      websiteUrl,
      openaiKey
    );
    
    if (leadershipExtraction.success && leadershipExtraction.leadership.length > 0) {
      result.leadership = leadershipExtraction.leadership;
      
      // Store org metadata from extraction
      result.legalForm = leadershipExtraction.org_structure.legal_form;
      result.estimatedStaff = leadershipExtraction.org_structure.total_staff;
      
      // Build organization structure
      result.orgStructure = buildOrganizationStructure(
        org.id,
        org.name,
        leadershipExtraction
      );
      
      // Identify key contacts
      result.primaryDecisionMaker = identifyPrimaryDecisionMaker(result.leadership);
      result.softwareBuyers = identifySoftwareBuyers(result.leadership);
      
      result.completenessScore = result.orgStructure.completeness_score;
      result.confidence = leadershipExtraction.confidence;
      
      logger.info(`  ✅ Extracted ${result.leadership.length} leadership contacts`);
      logger.info(`  📊 Completeness: ${result.completenessScore}%`);
      
      if (result.primaryDecisionMaker) {
        logger.info(`  🎯 Primary decision maker: ${result.primaryDecisionMaker.name}`);
        logger.info(`     Role: ${result.primaryDecisionMaker.role_display}`);
        if (result.primaryDecisionMaker.email) {
          logger.info(`     Email: ${result.primaryDecisionMaker.email}`);
        }
      }
      
      if (result.softwareBuyers.length > 0) {
        logger.info(`  💻 Software buyers identified: ${result.softwareBuyers.length}`);
        result.softwareBuyers.forEach(buyer => {
          logger.info(`     - ${buyer.name} (${buyer.role_display})`);
        });
      }
      
    } else {
      logger.warn('  ⚠️  No leadership found on website');
      result.errors.push('Leadership extraction failed or no data found');
    }
    
  } catch (error: any) {
    logger.error(`  ❌ Leadership extraction failed: ${error.message}`);
    result.errors.push(`Leadership extraction error: ${error.message}`);
  }

  // STEP 4: Standard AI enrichment (industry, etc.)
  logger.info('  🤖 Running AI classification...');
  try {
    const aiEnrichment = await enrichWithLLM(org.name, websiteUrl, openaiKey);
    
    if (aiEnrichment.industry && !org.industry) {
      updates.industry = aiEnrichment.industry;
      result.standardFields.push('industry');
      logger.info(`  ✅ Industry: ${aiEnrichment.industry}`);
    }
    
    // ALWAYS update Tätigkeitsfeld when AI classifies it (even if already exists)
    if (aiEnrichment.taetigkeitsfeld) {
      updates['d0ff2ebd4d3c12b3f1faad65b409a8e578d657a3'] = aiEnrichment.taetigkeitsfeld;
      result.standardFields.push('taetigkeitsfeld');
      logger.info(`  ✅ Tätigkeitsfeld: ${aiEnrichment.taetigkeitsfeld}`);
    }
  } catch (error: any) {
    logger.warn(`  ⚠️  AI classification failed: ${error.message}`);
  }

  // STEP 5: Generate AI description with projects and Arbeitsbereiche
  logger.info('  📝 Generating organization description...');
  try {
    const orgDescription = await generateOrgDescription(org.name, websiteUrl, openaiKey);
    
    if (orgDescription.description) {
      result.description = orgDescription.description;
      logger.info(`  ✅ Description generated (${orgDescription.description.length} chars)`);
    }
    
    if (orgDescription.flagshipProjects && orgDescription.flagshipProjects.length > 0) {
      result.flagshipProjects = orgDescription.flagshipProjects;
      logger.info(`  ✅ Found ${orgDescription.flagshipProjects.length} flagship projects`);
    }
    
    if (orgDescription.arbeitsbereiche && orgDescription.arbeitsbereiche.length > 0) {
      result.arbeitsbereiche = orgDescription.arbeitsbereiche;
      logger.info(`  ✅ Identified ${orgDescription.arbeitsbereiche.length} Arbeitsbereiche`);
    }
  } catch (error: any) {
    logger.warn(`  ⚠️  Description generation failed: ${error.message}`);
  }

  // Determine final status
  result.updates = updates;
  if (result.leadership.length > 0 && result.standardFields.length > 0) {
    result.status = 'success';
  } else if (result.leadership.length > 0 || result.standardFields.length > 0) {
    result.status = 'partial';
  } else {
    result.status = 'error';
  }

  return result;
}

/**
 * Create Person records in Pipedrive for leadership team
 */
async function createLeadershipContacts(
  pipedrive: PipedriveClient,
  orgId: number,
  leadership: LeadershipRole[],
  progress: string
): Promise<void> {
  
  for (const person of leadership) {
    try {
      // Check if person already exists
      const existingPersons = await pipedrive.getPersonsByOrganization(orgId);
      const exists = existingPersons.find(p => 
        p.name.toLowerCase() === person.name.toLowerCase()
      );
      
      if (exists) {
        logger.info(`${progress} ℹ️  Person already exists: ${person.name}`);
        continue;
      }
      
      // Create new person
      const personData: any = {
        name: person.name,
        org_id: orgId,
        email: person.email ? [{ value: person.email, primary: true, label: 'work' }] : undefined,
        phone: person.phone ? [{ value: person.phone, primary: true, label: 'work' }] : undefined,
        // Add custom field for role if available
        // job_title: person.role_display, // Uncomment if field exists
      };
      
      await pipedrive.createPerson(personData);
      logger.info(`${progress} 👤 Created contact: ${person.name} (${person.role_display})`);
      
      // Small delay to avoid rate limits
      await sleep(300);
      
    } catch (error: any) {
      logger.error(`${progress} ❌ Failed to create person ${person.name}: ${error.message}`);
    }
  }
}

/**
 * Build comprehensive note with ALL enriched data
 */
function buildComprehensiveNote(result: EnhancedEnrichmentResult, org: any): string {
  let note = '# 📊 LEAD ENRICHMENT REPORT\n\n';
  
  note += `**Organization:** ${result.orgName}\n`;
  note += `**Enrichment Date:** ${new Date().toLocaleDateString('de-DE')}\n`;
  note += `**Status:** ${result.status === 'success' ? '✅ Vollständig' : result.status === 'partial' ? '⚠️ Teilweise' : '❌ Fehler'}\n`;
  note += `**Data Completeness:** ${result.completenessScore}%\n`;
  note += `**Confidence Score:** ${Math.round(result.confidence * 100)}%\n\n`;
  
  note += '---\n\n';
  
  // SECTION 1: STANDARD ENRICHMENT
  note += '## 📌 BASISINFORMATIONEN\n\n';
  
  if (result.updates.website || org.website) {
    note += `**Website:** ${result.updates.website || org.website}\n`;
  }
  
  if (result.updates.linkedin || org.linkedin) {
    note += `**LinkedIn:** ${result.updates.linkedin || org.linkedin}\n`;
  }
  
  if (result.updates.address || org.address) {
    note += `**Adresse:** ${result.updates.address || org.address}\n`;
  }
  
  if (result.updates.industry || org.industry) {
    const industryMap: Record<string, string> = {
      '5': 'Bildung',
      '6': 'Unterhaltung/Kultur',
      '11': 'Gesundheitswesen',
      '13': 'Umwelt',
    };
    const industryValue = result.updates.industry || org.industry;
    const industryDisplay = industryMap[industryValue] || industryValue;
    note += `**Branche:** ${industryDisplay}\n`;
  }
  
  // Tätigkeitsfeld
  const taetigkeitsfeldKey = 'd0ff2ebd4d3c12b3f1faad65b409a8e578d657a3';
  if (result.updates[taetigkeitsfeldKey] || org[taetigkeitsfeldKey]) {
    const taetigkeitsfeldMap: Record<string, string> = {
      '45': 'Kinder- und Jugendhilfe',
      '46': 'Soziale Arbeit',
      '47': 'Umwelt- und Klimaschutz',
    };
    const taetigkeitsfeldValue = result.updates[taetigkeitsfeldKey] || org[taetigkeitsfeldKey];
    const taetigkeitsfeldDisplay = taetigkeitsfeldMap[taetigkeitsfeldValue] || taetigkeitsfeldValue;
    note += `**Tätigkeitsfeld:** ${taetigkeitsfeldDisplay}\n`;
  }
  
  if (result.legalForm) {
    note += `**Rechtsform:** ${formatLegalForm(result.legalForm)}\n`;
  }
  
  if (result.estimatedStaff) {
    note += `**Mitarbeiter (geschätzt):** ${result.estimatedStaff}\n`;
  }
  
  note += '\n';
  
  // SECTION 2: CONTACT INFORMATION (if any was found)
  const contactInfo = (result as any).contactInfo;
  if (contactInfo && (contactInfo.emails?.length > 0 || contactInfo.phones?.length > 0)) {
    note += '## 📞 KONTAKTINFORMATIONEN\n\n';
    
    if (contactInfo.emails && contactInfo.emails.length > 0) {
      note += '**E-Mails:**\n';
      contactInfo.emails.slice(0, 5).forEach((email: string) => {
        note += `- ${email}\n`;
      });
      if (contactInfo.emails.length > 5) {
        note += `- ... und ${contactInfo.emails.length - 5} weitere\n`;
      }
      note += '\n';
    }
    
    if (contactInfo.phones && contactInfo.phones.length > 0) {
      note += '**Telefonnummern:**\n';
      contactInfo.phones.slice(0, 5).forEach((phone: string) => {
        note += `- ${phone}\n`;
      });
      if (contactInfo.phones.length > 5) {
        note += `- ... und ${contactInfo.phones.length - 5} weitere\n`;
      }
      note += '\n';
    }
  }
  
  // SECTION 3: LEADERSHIP STRUCTURE
  if (result.leadership.length > 0) {
    note += '## 👥 FÜHRUNGSSTRUKTUR\n\n';
    
    // Primary decision maker
    if (result.primaryDecisionMaker) {
      note += '### 🎯 HAUPTANSPRECHPARTNER (Entscheider)\n\n';
      note += formatLeadershipPerson(result.primaryDecisionMaker, true);
      note += '\n';
    }
    
    // Software buyers
    if (result.softwareBuyers.length > 0) {
      note += '### 💻 SOFTWARE-ENTSCHEIDER\n\n';
      result.softwareBuyers.forEach(buyer => {
        if (buyer.name !== result.primaryDecisionMaker?.name) {
          note += formatLeadershipPerson(buyer, false);
        }
      });
      note += '\n';
    }
    
    // Full leadership team
    note += '### 📋 VOLLSTÄNDIGES FÜHRUNGSTEAM\n\n';
    
    // Group by authority level
    const byAuthority = {
      1: result.leadership.filter(l => l.authority_level === 1),
      2: result.leadership.filter(l => l.authority_level === 2),
      3: result.leadership.filter(l => l.authority_level === 3),
    };
    
    if (byAuthority[1].length > 0) {
      note += '**Vorstand / Geschäftsführung:**\n';
      byAuthority[1].forEach(p => note += formatLeadershipPerson(p, false));
      note += '\n';
    }
    
    if (byAuthority[2].length > 0) {
      note += '**Operative Führung:**\n';
      byAuthority[2].forEach(p => note += formatLeadershipPerson(p, false));
      note += '\n';
    }
    
    if (byAuthority[3].length > 0) {
      note += '**Governance / Aufsicht:**\n';
      byAuthority[3].forEach(p => note += formatLeadershipPerson(p, false));
      note += '\n';
    }
  }
  
  // SECTION 4: AI DESCRIPTION (if available)
  if (result.description || result.arbeitsbereiche || result.flagshipProjects) {
    note += '## 📝 ÜBER DIE ORGANISATION\n\n';
    
    if (result.description) {
      note += result.description + '\n\n';
    }
    
    if (result.arbeitsbereiche && result.arbeitsbereiche.length > 0) {
      note += '**Arbeitsbereiche:**\n';
      result.arbeitsbereiche.forEach(bereich => {
        note += `- ${bereich}\n`;
      });
      note += '\n';
    }
    
    if (result.flagshipProjects && result.flagshipProjects.length > 0) {
      note += '**Flagship-Projekte:**\n';
      result.flagshipProjects.forEach(project => {
        note += `- ${project}\n`;
      });
      note += '\n';
    }
  }
  
  // SECTION 5: ENRICHMENT DETAILS
  note += '## 🔧 ENRICHMENT DETAILS\n\n';
  note += `**Enriched Fields:** ${result.standardFields.join(', ') || 'none'}\n`;
  note += `**Leadership Contacts Extracted:** ${result.leadership.length}\n`;
  
  if (result.errors.length > 0) {
    note += `**Errors:** ${result.errors.length}\n`;
    result.errors.forEach(error => {
      note += `  - ${error}\n`;
    });
  }
  
  note += '\n---\n\n';
  note += `*Automatisch generiert am ${new Date().toLocaleString('de-DE')}*\n`;
  note += `*Zuverlässigkeit: ${Math.round(result.confidence * 100)}% | Vollständigkeit: ${result.completenessScore}%*`;
  
  return note;
}

function formatLeadershipPerson(person: LeadershipRole, detailed: boolean): string {
  let text = `**${person.name}** - ${person.role_display}\n`;
  
  if (person.email) {
    text += `  📧 ${person.email}\n`;
  }
  
  if (person.phone) {
    text += `  📞 ${person.phone}\n`;
  }
  
  if (detailed) {
    if (person.can_sign_contracts) {
      text += `  ✅ Vertragsunterzeichnung möglich\n`;
    }
    if (person.budget_authority) {
      text += `  💰 Budget-Verantwortung\n`;
    }
  }
  
  text += '\n';
  return text;
}

function formatLegalForm(legalForm: string): string {
  const map: Record<string, string> = {
    'eingetragener_verein': 'Eingetragener Verein (e.V.)',
    'ggmbh': 'Gemeinnützige GmbH (gGmbH)',
    'gug': 'Gemeinnützige Unternehmergesellschaft (gUG)',
    'stiftung': 'Stiftung',
    'other': 'Sonstige',
  };
  return map[legalForm] || legalForm;
}

// Helper functions
function extractOrgId(deal: any): number | null {
  if (deal.org_id && typeof deal.org_id === 'object' && deal.org_id.value) {
    return deal.org_id.value;
  } else if (deal.org_id && typeof deal.org_id === 'number') {
    return deal.org_id;
  }
  return null;
}

function needsEnrichment(org: any): boolean {
  return !org.website || !org.industry || org.person_id == null;
}

/**
 * Generate AI description with flagship projects and Arbeitsbereiche
 */
async function generateOrgDescription(
  orgName: string,
  website: string,
  openaiKey: string
): Promise<{
  description: string | null;
  flagshipProjects: string[];
  arbeitsbereiche: string[];
}> {
  const prompt = `Du bist ein Experte für deutsche gemeinnützige Organisationen.

Organisation: ${orgName}
Website: ${website}

AUFGABE: Erstelle eine prägnante Beschreibung dieser Organisation für ein CRM-System.

1. BESCHREIBUNG (PFLICHT):
   - Schreibe 2-3 Sätze auf Deutsch
   - Erkläre: Was macht die Organisation? Was ist ihre Mission/ihr Zweck?
   - Sei spezifisch und faktisch (keine Marketing-Sprache)
   - Nutze Informationen von der Website

2. ARBEITSBEREICHE (falls auf Website erkennbar):
   - Liste die Hauptarbeitsbereiche/Tätigkeitsfelder auf
   - Beispiele: "Jugendsozialarbeit", "Umweltbildung", "Beratung", "Pflege"
   - Maximal 5 Bereiche
   - Nur wenn klar auf der Website genannt

3. FLAGSHIP-PROJEKTE (falls auf Website erkennbar):
   - Liste wichtige Projekte oder Programme auf
   - Beispiele: "Projekt XYZ", "Initiative ABC", "Programm DEF"
   - Maximal 3 Projekte
   - Nur konkrete, benannte Projekte (keine allgemeinen Beschreibungen)

Antworte NUR mit JSON:
{
  "description": "2-3 Sätze Beschreibung",
  "arbeitsbereiche": ["Bereich 1", "Bereich 2", ...] oder [],
  "flagshipProjects": ["Projekt 1", "Projekt 2", ...] oder []
}

WICHTIG: 
- Description ist PFLICHT (nie null)
- arbeitsbereiche und flagshipProjects sind OPTIONAL ([] wenn nicht gefunden)
- Sei präzise und nutze nur Informationen von der Website
- Keine Erfindungen oder Annahmen`;

  try {
    const response = await callLLM(prompt, {
      model: 'gpt-4o-mini',
      temperature: 0.3,
      max_tokens: 500,
    });
    
    const parsed = JSON.parse(response);
    
    logger.info(`  📝 Description: "${parsed.description?.substring(0, 80)}..."`);
    if (parsed.arbeitsbereiche?.length > 0) {
      logger.info(`  🏢 Arbeitsbereiche: ${parsed.arbeitsbereiche.join(', ')}`);
    }
    if (parsed.flagshipProjects?.length > 0) {
      logger.info(`  🎯 Projects: ${parsed.flagshipProjects.join(', ')}`);
    }
    
    return {
      description: parsed.description || null,
      arbeitsbereiche: parsed.arbeitsbereiche || [],
      flagshipProjects: parsed.flagshipProjects || [],
    };
  } catch (error: any) {
    logger.error(`Description generation failed: ${error.message}`);
    return {
      description: null,
      arbeitsbereiche: [],
      flagshipProjects: [],
    };
  }
}

/**
 * Use AI to classify Tätigkeitsfeld with high accuracy
 */
async function enrichWithLLM(
  orgName: string,
  website: string,
  openaiKey: string
): Promise<{
  industry: string | null;
  taetigkeitsfeld: string | null;
}> {
  const prompt = `Du bist ein Experte für deutsche gemeinnützige Organisationen.

Organisation: ${orgName}
Website: ${website}

AUFGABE: Klassifiziere das Tätigkeitsfeld dieser Organisation.

WICHTIG - Wähle GENAU EINE der folgenden Kategorien:
1. "45" = Kinder- und Jugendhilfe
   Beispiele: Jugendamt, Jugendhilfeträger, Kinderschutz, Kinder- und Jugendarbeit, Schulsozialarbeit
   
2. "46" = Soziale Arbeit
   Beispiele: Allgemeine Sozialarbeit, Altenhilfe, Behindertenhilfe, Sozialberatung, Wohnungslosenhilfe, Familienberatung
   
3. "47" = Umwelt- und Klimaschutz
   Beispiele: Naturschutz, Umweltbildung, Klimaschutzprojekte, Nachhaltigkeit

WIE ENTSCHEIDEN:
- Wenn "Kinder", "Jugend", "Jugendhilfe", "Schule" im Namen → "45"
- Wenn "Sozial", "Pflege", "Behinderung", "Senioren" im Namen → "46"
- Wenn "Umwelt", "Klima", "Natur" im Namen → "47"
- Bei Unsicherheit → "46" (Standard für soziale Arbeit)

BEISPIELE:
- "AHB Kinder- und Jugendhilfe" → "45"
- "ajb gmbh" (ajb = Kinder und Jugend) → "45"
- "Altenpflegeheim Sonnenschein" → "46"
- "Naturschutzbund" → "47"
- "Sozialwerk St. Georg" → "46"

Antworte NUR mit JSON:
{
  "industry": "5" oder "11" oder null,
  "taetigkeitsfeld": "45" oder "46" oder "47",
  "confidence": 0.0-1.0,
  "reasoning": "Kurze Begründung"
}`;

  try {
    const response = await callLLM(prompt, {
      model: 'gpt-4o-mini',
      temperature: 0.1, // Low temperature for consistent classification
      max_tokens: 200,
    });
    
    const parsed = JSON.parse(response);
    
    // Validate that taetigkeitsfeld is one of the allowed values
    const validTaetigkeitsfelder = ['45', '46', '47'];
    if (parsed.taetigkeitsfeld && !validTaetigkeitsfelder.includes(parsed.taetigkeitsfeld)) {
      logger.warn(`Invalid Tätigkeitsfeld "${parsed.taetigkeitsfeld}", defaulting to "46"`);
      parsed.taetigkeitsfeld = '46'; // Default to social work
    }
    
    logger.info(`  🤖 AI Classification: Tätigkeitsfeld=${parsed.taetigkeitsfeld}, Confidence=${parsed.confidence}, Reasoning=${parsed.reasoning}`);
    
    return {
      industry: parsed.industry || null,
      taetigkeitsfeld: parsed.taetigkeitsfeld || null,
    };
  } catch (error: any) {
    logger.error(`AI classification failed: ${error.message}`);
    return {
      industry: null,
      taetigkeitsfeld: null,
    };
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function printSummary(
  results: EnhancedEnrichmentResult[],
  successCount: number,
  partialCount: number,
  errorCount: number,
  reportPath: string
) {
  logger.info('\n' + '='.repeat(80));
  logger.info('ENRICHMENT SUMMARY');
  logger.info('='.repeat(80));
  logger.info(`Total processed: ${results.length}`);
  logger.info(`✅ Fully enriched: ${successCount}`);
  logger.info(`⚠️  Partially enriched: ${partialCount}`);
  logger.info(`❌ Errors: ${errorCount}`);
  logger.info('');
  
  const totalLeadership = results.reduce((sum, r) => sum + r.leadership.length, 0);
  const withPrimaryContact = results.filter(r => r.primaryDecisionMaker).length;
  const withSoftwareBuyers = results.filter(r => r.softwareBuyers.length > 0).length;
  const avgCompleteness = results.reduce((sum, r) => sum + r.completenessScore, 0) / results.length;
  
  logger.info('👥 LEADERSHIP EXTRACTION:');
  logger.info(`   Total contacts extracted: ${totalLeadership}`);
  logger.info(`   Organizations with primary decision maker: ${withPrimaryContact}`);
  logger.info(`   Organizations with software buyers: ${withSoftwareBuyers}`);
  logger.info(`   Average data completeness: ${Math.round(avgCompleteness)}%`);
  logger.info('');
  logger.info(`📄 Report saved to: ${reportPath}`);
  logger.info('='.repeat(80));
}

main().catch((error) => {
  logger.error({ error: error.message }, 'Script failed');
  process.exit(1);
});

