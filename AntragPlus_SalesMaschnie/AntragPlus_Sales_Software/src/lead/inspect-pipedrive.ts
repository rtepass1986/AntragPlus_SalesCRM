#!/usr/bin/env ts-node
/**
 * Inspect Pipedrive data structure
 * 
 * This script:
 * 1. Fetches all deals and organizations
 * 2. Retrieves field metadata (including custom fields)
 * 3. Analyzes which fields are populated vs empty
 * 4. Outputs a report to help plan enrichment strategy
 */

import 'dotenv/config';
import { PipedriveClient } from './sync/pipedrive';
import { logger } from './utils/logger';
import * as fs from 'fs';
import * as path from 'path';

interface FieldAnalysis {
  fieldKey: string;
  fieldName: string;
  fieldType: string;
  totalRecords: number;
  filledCount: number;
  emptyCount: number;
  fillRate: number;
  sampleValues: any[];
}

async function main() {
  const apiToken = process.env.PIPEDRIVE_API_TOKEN;
  
  if (!apiToken) {
    logger.error('PIPEDRIVE_API_TOKEN not found in environment');
    process.exit(1);
  }

  const client = new PipedriveClient(apiToken);

  // Fetch metadata
  logger.info('=== FETCHING FIELD METADATA ===');
  const dealFields = await client.getDealFields();
  const orgFields = await client.getOrganizationFields();

  logger.info(`Deal fields: ${dealFields.length}`);
  logger.info(`Organization fields: ${orgFields.length}`);

  // Fetch data
  logger.info('\n=== FETCHING DATA ===');
  const deals = await client.getAllDeals();
  const orgs = await client.getAllOrganizations();

  logger.info(`\nDeals: ${deals.length}`);
  logger.info(`Organizations: ${orgs.length}`);

  // Analyze deals
  logger.info('\n=== ANALYZING DEAL FIELDS ===');
  const dealAnalysis = analyzeFields(deals, dealFields);
  
  // Analyze organizations
  logger.info('\n=== ANALYZING ORGANIZATION FIELDS ===');
  const orgAnalysis = analyzeFields(orgs, orgFields);

  // Generate report
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalDeals: deals.length,
      totalOrganizations: orgs.length,
      dealFieldsCount: dealFields.length,
      orgFieldsCount: orgFields.length,
    },
    dealFields: dealAnalysis,
    organizationFields: orgAnalysis,
    sampleDeals: deals.slice(0, 3),
    sampleOrganizations: orgs.slice(0, 3),
  };

  // Write report
  const reportPath = path.join(__dirname, 'reports', 'pipedrive-inspection.json');
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  logger.info(`\n✅ Report written to: ${reportPath}`);

  // Print summary to console
  printSummary(dealAnalysis, orgAnalysis, deals.length, orgs.length);
}

function analyzeFields(records: any[], fieldMetadata: any[]): FieldAnalysis[] {
  const analysis: FieldAnalysis[] = [];

  for (const field of fieldMetadata) {
    const key = field.key;
    let filledCount = 0;
    const sampleValues: any[] = [];

    for (const record of records) {
      const value = record[key];
      const isEmpty = value === null || 
                      value === undefined || 
                      value === '' || 
                      (Array.isArray(value) && value.length === 0);

      if (!isEmpty) {
        filledCount++;
        if (sampleValues.length < 3) {
          sampleValues.push(value);
        }
      }
    }

    const emptyCount = records.length - filledCount;
    const fillRate = records.length > 0 ? (filledCount / records.length) * 100 : 0;

    analysis.push({
      fieldKey: key,
      fieldName: field.name,
      fieldType: field.field_type,
      totalRecords: records.length,
      filledCount,
      emptyCount,
      fillRate: Math.round(fillRate * 100) / 100,
      sampleValues,
    });
  }

  return analysis.sort((a, b) => a.fillRate - b.fillRate);
}

function printSummary(
  dealAnalysis: FieldAnalysis[],
  orgAnalysis: FieldAnalysis[],
  totalDeals: number,
  totalOrgs: number
) {
  console.log('\n' + '='.repeat(80));
  console.log('PIPEDRIVE DATA INSPECTION SUMMARY');
  console.log('='.repeat(80));

  console.log(`\n📊 Total Records:`);
  console.log(`   Deals: ${totalDeals}`);
  console.log(`   Organizations: ${totalOrgs}`);

  console.log(`\n🔍 Fields with LOW fill rates (< 50%) - ENRICHMENT CANDIDATES:`);
  
  console.log(`\n  DEAL FIELDS:`);
  const lowFillDeals = dealAnalysis.filter(f => f.fillRate < 50 && f.emptyCount > 0);
  if (lowFillDeals.length === 0) {
    console.log('    ✓ All deal fields are well populated (>50%)');
  } else {
    lowFillDeals.slice(0, 15).forEach(field => {
      console.log(`    • ${field.fieldName} (${field.fieldKey}): ${field.fillRate}% filled (${field.emptyCount} empty)`);
    });
  }

  console.log(`\n  ORGANIZATION FIELDS:`);
  const lowFillOrgs = orgAnalysis.filter(f => f.fillRate < 50 && f.emptyCount > 0);
  if (lowFillOrgs.length === 0) {
    console.log('    ✓ All organization fields are well populated (>50%)');
  } else {
    lowFillOrgs.slice(0, 15).forEach(field => {
      console.log(`    • ${field.fieldName} (${field.fieldKey}): ${field.fillRate}% filled (${field.emptyCount} empty)`);
    });
  }

  console.log('\n' + '='.repeat(80));
  console.log('💡 Next: Review reports/pipedrive-inspection.json for full analysis');
  console.log('='.repeat(80) + '\n');
}

main().catch((error) => {
  logger.error({ error: error.message }, 'Inspection failed');
  process.exit(1);
});

