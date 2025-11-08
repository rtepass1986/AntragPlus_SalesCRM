#!/usr/bin/env ts-node
/**
 * Move deals from Kinder und Jugendhilfe_only to Lead enriched/geprüft
 * if organization does NOT have Tätigkeitsfeld 45 or 46
 */

import 'dotenv/config';
import { PipedriveClient } from './sync/pipedrive';
import { logger } from './utils/logger';

const TATIGKEITSFELD_KEY = 'd0ff2ebd4d3c12b3f1faad65b409a8e578d657a3';
const SOURCE_STAGE = 'Kinder und Jugendhilfe_only';
const TARGET_STAGE = 'Lead enriched/geprüft';
const KEEP_IDS = ['45', '46']; // Keep deals with these IDs in source stage

async function main() {
  const pipedriveToken = process.env.PIPEDRIVE_API_TOKEN;

  if (!pipedriveToken) {
    logger.error('Missing PIPEDRIVE_API_TOKEN');
    process.exit(1);
  }

  const pipedrive = new PipedriveClient(pipedriveToken);

  logger.info('=== MOVING NON-MATCHING DEALS ===');
  logger.info(`Source stage: "${SOURCE_STAGE}"`);
  logger.info(`Target stage: "${TARGET_STAGE}"`);
  logger.info(`Keeping deals with Tätigkeitsfeld: ${KEEP_IDS.join(', ')}`);
  logger.info(`Moving deals with other or empty Tätigkeitsfeld values`);

  // Find stages
  logger.info('Fetching stages...');
  const stages = await pipedrive.getStages();
  const sourceStage = stages.find(s => s.name === SOURCE_STAGE);
  const targetStage = stages.find(s => s.name === TARGET_STAGE);

  if (!sourceStage) {
    logger.error(`Stage "${SOURCE_STAGE}" not found!`);
    process.exit(1);
  }

  if (!targetStage) {
    logger.error(`Stage "${TARGET_STAGE}" not found!`);
    process.exit(1);
  }

  logger.info(`✅ Found source stage: "${sourceStage.name}" (ID: ${sourceStage.id})`);
  logger.info(`✅ Found target stage: "${targetStage.name}" (ID: ${targetStage.id})`);

  // Fetch all deals
  logger.info('Fetching deals...');
  const allDeals = await pipedrive.getAllDeals();
  const dealsInSourceStage = allDeals.filter(deal => deal.stage_id === sourceStage.id);
  logger.info(`Deals in "${SOURCE_STAGE}": ${dealsInSourceStage.length}`);

  // Fetch all organizations
  logger.info('Fetching organizations...');
  const allOrgs = await pipedrive.getAllOrganizations();
  logger.info(`Total organizations: ${allOrgs.length}`);

  // Create map of organization Tätigkeitsfeld values
  const orgTatigkeitsfeld = new Map<number, string | null>();
  for (const org of allOrgs) {
    const value = org[TATIGKEITSFELD_KEY];
    orgTatigkeitsfeld.set(org.id, value ? String(value) : null);
  }

  // Find deals to move (those WITHOUT Tätigkeitsfeld 45 or 46)
  const dealsToMove: any[] = [];
  for (const deal of dealsInSourceStage) {
    let orgId: number | null = null;
    
    if (deal.org_id && typeof deal.org_id === 'object' && deal.org_id.value) {
      orgId = deal.org_id.value;
    } else if (deal.org_id && typeof deal.org_id === 'number') {
      orgId = deal.org_id;
    }

    if (orgId) {
      const tatigkeitsfeld = orgTatigkeitsfeld.get(orgId);
      
      // Move if Tätigkeitsfeld is NOT 45 or 46 (or if it's empty/null)
      if (!tatigkeitsfeld || !KEEP_IDS.includes(tatigkeitsfeld)) {
        dealsToMove.push({
          id: deal.id,
          title: deal.title,
          orgId: orgId,
          tatigkeitsfeld: tatigkeitsfeld || '(empty)'
        });
      }
    }
  }

  logger.info(`Deals to move (NOT 45/46): ${dealsToMove.length}`);

  if (dealsToMove.length === 0) {
    logger.info('No deals to move. Exiting.');
    return;
  }

  // Move deals
  let movedCount = 0;
  let errorCount = 0;

  for (let i = 0; i < dealsToMove.length; i++) {
    const deal = dealsToMove[i];
    const progress = `[${i + 1}/${dealsToMove.length}]`;

    try {
      await pipedrive.updateDeal(deal.id, { stage_id: targetStage.id });
      logger.info(`${progress} ✅ Moved: ${deal.title} (Tätigkeitsfeld: ${deal.tatigkeitsfeld})`);
      movedCount++;
    } catch (error: any) {
      logger.error(`${progress} ❌ Failed to move deal ${deal.id}: ${error.message}`);
      errorCount++;
    }

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  logger.info('\n' + '='.repeat(80));
  logger.info('SUMMARY');
  logger.info('='.repeat(80));
  logger.info(`Total deals moved: ${movedCount}`);
  logger.info(`Errors: ${errorCount}`);
  logger.info(`From: "${SOURCE_STAGE}"`);
  logger.info(`To: "${TARGET_STAGE}"`);
  logger.info(`Kept deals with Tätigkeitsfeld 45 or 46 in source stage`);
  logger.info('='.repeat(80));
}

main().catch((error) => {
  logger.error({ error: error.message }, 'Script failed');
  process.exit(1);
});

