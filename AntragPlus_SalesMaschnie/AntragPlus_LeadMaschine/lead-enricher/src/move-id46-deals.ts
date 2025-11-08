#!/usr/bin/env ts-node
/**
 * Move deals with Tätigkeitsfeld ID 46 from Kinder und Jugendhilfe_only to Lead enriched/geprüft
 * Keep only deals with Tätigkeitsfeld ID 45 in Kinder und Jugendhilfe_only
 */

import 'dotenv/config';
import { PipedriveClient } from './sync/pipedrive';
import { logger } from './utils/logger';

const TATIGKEITSFELD_KEY = 'd0ff2ebd4d3c12b3f1faad65b409a8e578d657a3';
const SOURCE_STAGE = 'Kinder und Jugendhilfe_only';
const TARGET_STAGE = 'Lead enriched/geprüft';
const KEEP_ID = '45'; // Only keep deals with ID 45 (Education & Youth)
const MOVE_ID = '46'; // Move deals with ID 46 (Social, Culture, etc.)

async function main() {
  const pipedriveToken = process.env.PIPEDRIVE_API_TOKEN;

  if (!pipedriveToken) {
    logger.error('Missing PIPEDRIVE_API_TOKEN');
    process.exit(1);
  }

  const pipedrive = new PipedriveClient(pipedriveToken);

  logger.info('=== MOVING DEALS WITH TÄTIGKEITSFELD 46 ===');
  logger.info(`Source stage: "${SOURCE_STAGE}"`);
  logger.info(`Target stage: "${TARGET_STAGE}"`);
  logger.info(`Keeping only deals with Tätigkeitsfeld: ${KEEP_ID} (Education & Youth)`);
  logger.info(`Moving deals with Tätigkeitsfeld: ${MOVE_ID} (Social, Culture, Integration, etc.)`);

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

  // Find deals to move (those with Tätigkeitsfeld 46)
  const dealsToMove: any[] = [];
  let keepCount = 0;
  
  for (const deal of dealsInSourceStage) {
    let orgId: number | null = null;
    
    if (deal.org_id && typeof deal.org_id === 'object' && deal.org_id.value) {
      orgId = deal.org_id.value;
    } else if (deal.org_id && typeof deal.org_id === 'number') {
      orgId = deal.org_id;
    }

    if (orgId) {
      const tatigkeitsfeld = orgTatigkeitsfeld.get(orgId);
      
      if (tatigkeitsfeld === MOVE_ID) {
        // Move deals with ID 46
        dealsToMove.push({
          id: deal.id,
          title: deal.title,
          orgId: orgId,
          tatigkeitsfeld: tatigkeitsfeld
        });
      } else if (tatigkeitsfeld === KEEP_ID) {
        // Count deals we're keeping
        keepCount++;
      }
    }
  }

  logger.info(`Deals with ID 45 (keeping): ${keepCount}`);
  logger.info(`Deals with ID 46 (moving): ${dealsToMove.length}`);

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
      logger.info(`${progress} ✅ Moved: ${deal.title}`);
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
  logger.info(`Deals moved (Tätigkeitsfeld 46): ${movedCount}`);
  logger.info(`Deals kept (Tätigkeitsfeld 45): ${keepCount}`);
  logger.info(`Errors: ${errorCount}`);
  logger.info(`From: "${SOURCE_STAGE}"`);
  logger.info(`To: "${TARGET_STAGE}"`);
  logger.info('='.repeat(80));
  logger.info(`\n✅ "${SOURCE_STAGE}" now contains only Education & Youth organizations (ID 45)`);
}

main().catch((error) => {
  logger.error({ error: error.message }, 'Script failed');
  process.exit(1);
});

