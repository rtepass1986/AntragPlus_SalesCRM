#!/usr/bin/env ts-node
/**
 * Verify data completeness across Contact, Organization, and Deal levels
 */

import 'dotenv/config';
import { PipedriveClient } from './sync/pipedrive';
import { logger } from './utils/logger';
import * as fs from 'fs';
import * as path from 'path';

const TATIGKEITSFELD_KEY = 'd0ff2ebd4d3c12b3f1faad65b409a8e578d657a3';
const STAGE_NAME = process.env.STAGE || 'Kinder und Jugendhilfe_only';

interface DataGap {
  dealId: number;
  dealTitle: string;
  orgId: number;
  orgName: string;
  gaps: string[];
}

async function main() {
  const pipedriveToken = process.env.PIPEDRIVE_API_TOKEN;

  if (!pipedriveToken) {
    logger.error('Missing PIPEDRIVE_API_TOKEN');
    process.exit(1);
  }

  const pipedrive = new PipedriveClient(pipedriveToken);

  logger.info('=== VERIFYING DATA COMPLETENESS ===');
  logger.info(`Stage: "${STAGE_NAME}"`);

  // Find stage
  const stages = await pipedrive.getStages();
  const targetStage = stages.find(s => s.name === STAGE_NAME);

  if (!targetStage) {
    logger.error(`Stage "${STAGE_NAME}" not found!`);
    process.exit(1);
  }

  logger.info(`✅ Found stage: "${targetStage.name}" (ID: ${targetStage.id})`);

  // Fetch deals in this stage
  logger.info('Fetching deals...');
  const allDeals = await pipedrive.getAllDeals();
  const dealsInStage = allDeals.filter(deal => deal.stage_id === targetStage.id);
  logger.info(`Total deals in stage: ${dealsInStage.length}`);

  // Fetch all organizations
  logger.info('Fetching organizations...');
  const allOrgs = await pipedrive.getAllOrganizations();
  const orgMap = new Map(allOrgs.map(org => [org.id, org]));

  const dataGaps: DataGap[] = [];
  const stats = {
    totalDeals: dealsInStage.length,
    orgsWithoutWebsite: 0,
    orgsWithoutLinkedIn: 0,
    orgsWithoutIndustry: 0,
    orgsWithoutTatigkeitsfeld: 0,
    orgsWithoutContact: 0,
    contactsWithoutEmail: 0,
    contactsWithoutPhone: 0,
    dealsWithoutNotes: 0,
  };

  logger.info('\nAnalyzing data completeness...\n');

  for (let i = 0; i < dealsInStage.length; i++) {
    const deal = dealsInStage[i];
    const progress = `[${i + 1}/${dealsInStage.length}]`;

    let orgId: number | null = null;
    if (deal.org_id && typeof deal.org_id === 'object' && deal.org_id.value) {
      orgId = deal.org_id.value;
    } else if (deal.org_id && typeof deal.org_id === 'number') {
      orgId = deal.org_id;
    }

    if (!orgId) {
      logger.warn(`${progress} Deal "${deal.title}" has no organization`);
      continue;
    }

    const org = orgMap.get(orgId);
    if (!org) {
      logger.warn(`${progress} Organization ${orgId} not found`);
      continue;
    }

    const gaps: string[] = [];

    // Check organization fields
    if (!org.website || org.website.trim() === '') {
      gaps.push('❌ Organization: Missing website');
      stats.orgsWithoutWebsite++;
    }

    if (!org.linkedin || org.linkedin.trim() === '') {
      gaps.push('⚠️  Organization: Missing LinkedIn');
      stats.orgsWithoutLinkedIn++;
    }

    if (!org.industry) {
      gaps.push('❌ Organization: Missing industry');
      stats.orgsWithoutIndustry++;
    }

    const tatigkeitsfeld = org[TATIGKEITSFELD_KEY];
    if (!tatigkeitsfeld) {
      gaps.push('❌ Organization: Missing Tätigkeitsfeld');
      stats.orgsWithoutTatigkeitsfeld++;
    }

    // Check contacts (persons)
    try {
      const persons = await pipedrive.getPersonsByOrganization(orgId);
      
      if (persons.length === 0) {
        gaps.push('❌ Contact: No contact/person found');
        stats.orgsWithoutContact++;
      } else {
        const person = persons[0]; // Check first contact
        
        // Check email
        const hasEmail = person.email && person.email.length > 0 && 
                        person.email.some((e: any) => e.value && e.value.trim() !== '');
        if (!hasEmail) {
          gaps.push('❌ Contact: Missing email');
          stats.contactsWithoutEmail++;
        }

        // Check phone
        const hasPhone = person.phone && person.phone.length > 0 && 
                        person.phone.some((p: any) => p.value && p.value.trim() !== '');
        if (!hasPhone) {
          gaps.push('⚠️  Contact: Missing phone');
          stats.contactsWithoutPhone++;
        }
      }
    } catch (error: any) {
      logger.error(`${progress} Error fetching contacts: ${error.message}`);
    }

    // Check deal notes
    if (!deal.notes_count || deal.notes_count === 0) {
      gaps.push('⚠️  Deal: No notes found');
      stats.dealsWithoutNotes++;
    }

    if (gaps.length > 0) {
      dataGaps.push({
        dealId: deal.id,
        dealTitle: deal.title,
        orgId: orgId,
        orgName: org.name,
        gaps: gaps
      });
    }

    // Progress indicator
    if (i % 10 === 0) {
      logger.info(`${progress} Checked...`);
    }

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  // Generate report
  logger.info('\n' + '='.repeat(80));
  logger.info('DATA COMPLETENESS REPORT');
  logger.info('='.repeat(80));
  logger.info(`Stage: "${STAGE_NAME}"`);
  logger.info(`Total deals analyzed: ${stats.totalDeals}`);
  logger.info('');
  logger.info('ORGANIZATION LEVEL:');
  logger.info(`  Missing website: ${stats.orgsWithoutWebsite}`);
  logger.info(`  Missing LinkedIn: ${stats.orgsWithoutLinkedIn}`);
  logger.info(`  Missing industry: ${stats.orgsWithoutIndustry}`);
  logger.info(`  Missing Tätigkeitsfeld: ${stats.orgsWithoutTatigkeitsfeld}`);
  logger.info('');
  logger.info('CONTACT LEVEL:');
  logger.info(`  Organizations without contact: ${stats.orgsWithoutContact}`);
  logger.info(`  Contacts missing email: ${stats.contactsWithoutEmail}`);
  logger.info(`  Contacts missing phone: ${stats.contactsWithoutPhone}`);
  logger.info('');
  logger.info('DEAL LEVEL:');
  logger.info(`  Deals without notes: ${stats.dealsWithoutNotes}`);
  logger.info('');
  logger.info('='.repeat(80));
  logger.info(`Deals with data gaps: ${dataGaps.length}`);
  logger.info('='.repeat(80));

  // Show first 20 deals with gaps
  if (dataGaps.length > 0) {
    logger.info('\nFIRST 20 DEALS WITH DATA GAPS:\n');
    dataGaps.slice(0, 20).forEach((gap, idx) => {
      logger.info(`${idx + 1}. Deal: "${gap.dealTitle}" (ID: ${gap.dealId})`);
      logger.info(`   Org: "${gap.orgName}" (ID: ${gap.orgId})`);
      gap.gaps.forEach(g => logger.info(`   ${g}`));
      logger.info('');
    });
  }

  // Save full report to file
  const reportPath = path.join(__dirname, 'reports', `data-gaps-${Date.now()}.json`);
  fs.writeFileSync(reportPath, JSON.stringify({ stats, dataGaps }, null, 2));
  logger.info(`\n📄 Full report saved to: ${reportPath}`);

  // Summary
  logger.info('\n' + '='.repeat(80));
  if (dataGaps.length === 0) {
    logger.info('✅ ALL DATA COMPLETE! No gaps found.');
  } else {
    logger.info(`⚠️  Found ${dataGaps.length} deals with incomplete data.`);
    logger.info(`   Most common gaps:`);
    logger.info(`   - Missing phones: ${stats.contactsWithoutPhone}`);
    logger.info(`   - Missing LinkedIn: ${stats.orgsWithoutLinkedIn}`);
    logger.info(`   - Missing website: ${stats.orgsWithoutWebsite}`);
  }
  logger.info('='.repeat(80));
}

main().catch((error) => {
  logger.error({ error: error.message }, 'Script failed');
  process.exit(1);
});

