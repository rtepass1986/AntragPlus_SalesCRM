/**
 * Analyze a Pipedrive stage to identify enrichment gaps
 */

import { PipedriveClient } from './sync/pipedrive';
import { logger } from './utils/logger';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  const pipedriveToken = process.env.PIPEDRIVE_API_TOKEN;
  if (!pipedriveToken) {
    throw new Error('PIPEDRIVE_API_TOKEN not found in environment');
  }

  const STAGE_NAME = process.env.STAGE_NAME || 'Kinder und Jugendhilfe_only';
  
  logger.info(`🔍 Analyzing stage: "${STAGE_NAME}"`);
  
  const pipedrive = new PipedriveClient(pipedriveToken);
  
  // Fetch stages
  const stages = await pipedrive.getStages();
  const targetStage = stages.find(s => s.name === STAGE_NAME);
  
  if (!targetStage) {
    logger.error(`Stage "${STAGE_NAME}" not found`);
    logger.info('Available stages:');
    stages.forEach(s => logger.info(`  - ${s.name} (ID: ${s.id})`));
    process.exit(1);
  }
  
  logger.info(`✅ Found stage: "${targetStage.name}" (ID: ${targetStage.id})`);
  
  // Fetch all deals
  const allDeals = await pipedrive.getAllDeals();
  const dealsInStage = allDeals.filter(d => 
    d.stage_id === targetStage.id && d.status !== 'lost'
  );
  
  logger.info(`📊 Total deals in stage: ${dealsInStage.length}`);
  
  // Map deals to organizations
  const orgIds = new Set<number>();
  const dealToOrg = new Map<number, number>();
  
  dealsInStage.forEach(deal => {
    const orgId = extractOrgId(deal);
    if (orgId) {
      orgIds.add(orgId);
      dealToOrg.set(deal.id, orgId);
    }
  });
  
  logger.info(`📊 Unique organizations: ${orgIds.size}`);
  
  // Fetch all organizations
  const allOrgs = await pipedrive.getAllOrganizations();
  const orgsInStage = allOrgs.filter(org => orgIds.has(org.id));
  
  logger.info(`📊 Fetched organization data for ${orgsInStage.length} organizations`);
  
  // Analyze gaps
  const analysis = analyzeEnrichmentGaps(orgsInStage);
  
  // Print summary
  printSummary(analysis);
  
  // Save detailed report
  const reportPath = path.join(__dirname, 'reports', `stage-analysis-${Date.now()}.json`);
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(analysis, null, 2));
  
  logger.info(`\n📄 Detailed report saved to: ${reportPath}`);
}

function extractOrgId(deal: any): number | null {
  if (deal.org_id && typeof deal.org_id === 'object' && deal.org_id.value) {
    return deal.org_id.value;
  } else if (deal.org_id && typeof deal.org_id === 'number') {
    return deal.org_id;
  }
  return null;
}

interface GapAnalysis {
  totalOrgs: number;
  summary: {
    field: string;
    missing: number;
    percentage: number;
    canEnrich: boolean;
    priority: 'high' | 'medium' | 'low';
  }[];
  recommendations: string[];
  orgsNeedingEnrichment: {
    id: number;
    name: string;
    missingFields: string[];
    priority: 'high' | 'medium' | 'low';
  }[];
}

function analyzeEnrichmentGaps(orgs: any[]): GapAnalysis {
  const taetigkeitsfeldKey = 'd0ff2ebd4d3c12b3f1faad65b409a8e578d657a3';
  
  const gaps = {
    website: 0,
    linkedin: 0,
    address: 0,
    industry: 0,
    taetigkeitsfeld: 0,
    personRecords: 0,
    notes: 0,
    description: 0,
  };
  
  const orgsNeedingEnrichment: any[] = [];
  
  orgs.forEach(org => {
    const missingFields: string[] = [];
    
    if (!org.website) {
      gaps.website++;
      missingFields.push('website');
    }
    
    if (!org.linkedin) {
      gaps.linkedin++;
      missingFields.push('linkedin');
    }
    
    if (!org.address) {
      gaps.address++;
      missingFields.push('address');
    }
    
    if (!org.industry) {
      gaps.industry++;
      missingFields.push('industry');
    }
    
    if (!org[taetigkeitsfeldKey]) {
      gaps.taetigkeitsfeld++;
      missingFields.push('tätigkeitsfeld');
    }
    
    if (!org.person_id || org.person_id.length === 0) {
      gaps.personRecords++;
      missingFields.push('person_records');
    }
    
    if (!org.notes_count || org.notes_count === 0) {
      gaps.notes++;
      missingFields.push('notes');
    }
    
    // Estimate if description is missing (we can't check directly)
    if (!org.notes_count || org.notes_count === 0) {
      gaps.description++;
      missingFields.push('description');
    }
    
    if (missingFields.length > 0) {
      // Calculate priority
      let priority: 'high' | 'medium' | 'low' = 'low';
      if (missingFields.includes('website') || missingFields.includes('tätigkeitsfeld')) {
        priority = 'high';
      } else if (missingFields.includes('person_records') || missingFields.includes('industry')) {
        priority = 'medium';
      }
      
      orgsNeedingEnrichment.push({
        id: org.id,
        name: org.name,
        missingFields,
        priority,
      });
    }
  });
  
  const totalOrgs = orgs.length;
  
  const summary = [
    {
      field: 'Website',
      missing: gaps.website,
      percentage: Math.round((gaps.website / totalOrgs) * 100),
      canEnrich: true,
      priority: 'high' as const,
    },
    {
      field: 'Tätigkeitsfeld',
      missing: gaps.taetigkeitsfeld,
      percentage: Math.round((gaps.taetigkeitsfeld / totalOrgs) * 100),
      canEnrich: true,
      priority: 'high' as const,
    },
    {
      field: 'Person Records (Leadership)',
      missing: gaps.personRecords,
      percentage: Math.round((gaps.personRecords / totalOrgs) * 100),
      canEnrich: true,
      priority: 'high' as const,
    },
    {
      field: 'Description & Projects',
      missing: gaps.description,
      percentage: Math.round((gaps.description / totalOrgs) * 100),
      canEnrich: true,
      priority: 'medium' as const,
    },
    {
      field: 'Address',
      missing: gaps.address,
      percentage: Math.round((gaps.address / totalOrgs) * 100),
      canEnrich: true,
      priority: 'medium' as const,
    },
    {
      field: 'Industry',
      missing: gaps.industry,
      percentage: Math.round((gaps.industry / totalOrgs) * 100),
      canEnrich: true,
      priority: 'medium' as const,
    },
    {
      field: 'LinkedIn',
      missing: gaps.linkedin,
      percentage: Math.round((gaps.linkedin / totalOrgs) * 100),
      canEnrich: true,
      priority: 'low' as const,
    },
    {
      field: 'Notes',
      missing: gaps.notes,
      percentage: Math.round((gaps.notes / totalOrgs) * 100),
      canEnrich: true,
      priority: 'low' as const,
    },
  ];
  
  // Generate recommendations
  const recommendations: string[] = [];
  
  if (gaps.website > 0) {
    recommendations.push(`✅ ${gaps.website} organizations missing website - can be found via Tavily search`);
  }
  
  if (gaps.taetigkeitsfeld > 0) {
    recommendations.push(`✅ ${gaps.taetigkeitsfeld} organizations missing Tätigkeitsfeld - can be AI-classified`);
  }
  
  if (gaps.personRecords > 0) {
    recommendations.push(`✅ ${gaps.personRecords} organizations missing leadership contacts - can be extracted from websites`);
  }
  
  if (gaps.description > 0) {
    recommendations.push(`✅ ${gaps.description} organizations missing description & projects - can be AI-generated`);
  }
  
  if (gaps.address > 0) {
    recommendations.push(`✅ ${gaps.address} organizations missing address - can be scraped from Impressum`);
  }
  
  const totalNeedingEnrichment = orgsNeedingEnrichment.length;
  const highPriority = orgsNeedingEnrichment.filter(o => o.priority === 'high').length;
  const mediumPriority = orgsNeedingEnrichment.filter(o => o.priority === 'medium').length;
  
  recommendations.push('');
  recommendations.push('📊 SUMMARY:');
  recommendations.push(`  - ${totalNeedingEnrichment} of ${totalOrgs} organizations need enrichment (${Math.round((totalNeedingEnrichment/totalOrgs)*100)}%)`);
  recommendations.push(`  - ${highPriority} high priority (missing website or Tätigkeitsfeld)`);
  recommendations.push(`  - ${mediumPriority} medium priority (missing contacts or industry)`);
  recommendations.push('');
  recommendations.push('🚀 RECOMMENDED ACTION:');
  recommendations.push(`  Run: FILTER_STAGE="Kinder und Jugendhilfe_only" MAX_ORGS=${Math.min(totalNeedingEnrichment, 100)} npm run enrich:leadership`);
  
  return {
    totalOrgs,
    summary,
    recommendations,
    orgsNeedingEnrichment: orgsNeedingEnrichment.slice(0, 50), // Top 50 for report
  };
}

function printSummary(analysis: GapAnalysis) {
  logger.info('\n' + '='.repeat(80));
  logger.info('ENRICHMENT GAP ANALYSIS');
  logger.info('='.repeat(80));
  
  logger.info(`\nTotal Organizations: ${analysis.totalOrgs}`);
  logger.info(`Organizations Needing Enrichment: ${analysis.orgsNeedingEnrichment.length}`);
  
  logger.info('\n📊 MISSING DATA BY FIELD:\n');
  
  analysis.summary.forEach(item => {
    const priorityIcon = item.priority === 'high' ? '🔴' : item.priority === 'medium' ? '🟡' : '🟢';
    const enrichIcon = item.canEnrich ? '✅' : '❌';
    logger.info(`${priorityIcon} ${enrichIcon} ${item.field.padEnd(30)} ${item.missing.toString().padStart(4)} missing (${item.percentage}%)`);
  });
  
  logger.info('\n💡 RECOMMENDATIONS:\n');
  analysis.recommendations.forEach(rec => logger.info(rec));
  
  logger.info('\n🎯 TOP ORGANIZATIONS NEEDING ENRICHMENT:\n');
  analysis.orgsNeedingEnrichment.slice(0, 10).forEach((org, i) => {
    const priorityIcon = org.priority === 'high' ? '🔴' : org.priority === 'medium' ? '🟡' : '🟢';
    logger.info(`${(i+1).toString().padStart(2)}. ${priorityIcon} ${org.name.padEnd(50)} Missing: ${org.missingFields.join(', ')}`);
  });
  
  if (analysis.orgsNeedingEnrichment.length > 10) {
    logger.info(`\n... and ${analysis.orgsNeedingEnrichment.length - 10} more (see full report file)`);
  }
  
  logger.info('\n' + '='.repeat(80));
}

main().catch(error => {
  logger.error({ error: error.message }, 'Analysis failed');
  process.exit(1);
});

