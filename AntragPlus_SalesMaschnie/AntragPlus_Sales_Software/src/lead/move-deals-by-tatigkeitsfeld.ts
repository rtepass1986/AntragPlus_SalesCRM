#!/usr/bin/env ts-node
/**
 * Move deals to specific stage based on organization's Tätigkeitsfeld
 */

import 'dotenv/config';
import { PipedriveClient } from './sync/pipedrive';
import { logger } from './utils/logger';

const TATIGKEITSFELD_KEY = 'd0ff2ebd4d3c12b3f1faad65b409a8e578d657a3';
const TARGET_STAGE = 'Kinder und Jugendhilfe_only';
const TATIGKEITSFELD_IDS = ['45', '46']; // IDs to match

async function main() {
  const pipedriveToken = process.env.PIPEDRIVE_API_TOKEN;

  if (!pipedriveToken) {
    logger.error('Missing PIPEDRIVE_API_TOKEN');
    process.exit(1);
  }

  const pipedrive = new PipedriveClient(pipedriveToken);

  logger.info('=== MOVING DEALS BY TÄTIGKEITSFELD ===');
  logger.info(`Target stage: "${TARGET_STAGE}"`);
  logger.info(`Tätigkeitsfeld IDs: ${TATIGKEITSFELD_IDS.join(', ')}`);

  // Find target stage
  logger.info('Fetching stages...');
  const stages = await pipedrive.getStages();
  const targetStage = stages.find(s => s.name === TARGET_STAGE);

  if (!targetStage) {
    logger.error(`Stage "${TARGET_STAGE}" not found!`);
    logger.info('Available stages:');
    stages.forEach(s => logger.info(`  - ${s.name} (ID: ${s.id})`));
    process.exit(1);
  }

  logger.info(`✅ Found target stage: "${targetStage.name}" (ID: ${targetStage.id})`);

  // Fetch all deals
  logger.info('Fetching deals...');
  const allDeals = await pipedrive.getAllDeals();
  logger.info(`Total deals: ${allDeals.length}`);

  // Fetch all organizations
  logger.info('Fetching organizations...');
  const allOrgs = await pipedrive.getAllOrganizations();
  logger.info(`Total organizations: ${allOrgs.length}`);

  // Create map of organizations with matching Tätigkeitsfeld
  const matchingOrgIds = new Set<number>();
  for (const org of allOrgs) {
    const tatigkeitsfeldValue = org[TATIGKEITSFELD_KEY];
    if (tatigkeitsfeldValue && TATIGKEITSFELD_IDS.includes(String(tatigkeitsfeldValue))) {
      matchingOrgIds.add(org.id);
    }
  }

  logger.info(`Organizations with Tätigkeitsfeld ${TATIGKEITSFELD_IDS.join(' or ')}: ${matchingOrgIds.size}`);

  // Find deals linked to these organizations
  const dealsToMove: any[] = [];
  for (const deal of allDeals) {
    let orgId: number | null = null;
    
    if (deal.org_id && typeof deal.org_id === 'object' && deal.org_id.value) {
      orgId = deal.org_id.value;
    } else if (deal.org_id && typeof deal.org_id === 'number') {
      orgId = deal.org_id;
    }

    if (orgId && matchingOrgIds.has(orgId)) {
      // Skip if already in target stage
      if (deal.stage_id !== targetStage.id) {
        dealsToMove.push({
          id: deal.id,
          title: deal.title,
          orgId: orgId,
          currentStageId: deal.stage_id
        });
      }
    }
  }

  logger.info(`Deals to move: ${dealsToMove.length}`);

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
      logger.info(`${progress} ✅ Moved: ${deal.title} (Deal ID: ${deal.id})`);
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
  logger.info(`Target stage: "${TARGET_STAGE}"`);
  logger.info('='.repeat(80));
}

main().catch((error) => {
  logger.error({ error: error.message }, 'Script failed');
  process.exit(1);
});

