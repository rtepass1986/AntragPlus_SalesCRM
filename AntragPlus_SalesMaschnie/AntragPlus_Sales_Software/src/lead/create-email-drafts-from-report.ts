/**
 * Generate email drafts from existing enrichment reports
 * 
 * Usage:
 * ts-node src/create-email-drafts-from-report.ts [report-file] [template-id] [format]
 * 
 * Examples:
 * ts-node src/create-email-drafts-from-report.ts src/reports/leadership-enrichment-*.json
 * ts-node src/create-email-drafts-from-report.ts src/reports/latest.json software-focus
 * ts-node src/create-email-drafts-from-report.ts src/reports/latest.json software-focus markdown
 */

import * as fs from 'fs';
import * as path from 'path';
import { generateBulkEmailDrafts, exportDrafts, type EmailDraftData } from './generate-email-drafts';
import { ALL_TEMPLATES } from './templates/email-templates';
import { logger } from './utils/logger';

async function main() {
  const args = process.argv.slice(2);
  
  // Parse arguments
  const reportPath = args[0] || findLatestReport();
  const templateId = args[1]; // Optional
  const format = (args[2] || 'markdown') as 'json' | 'csv' | 'markdown';
  
  if (!reportPath) {
    logger.error('No report file specified and no reports found');
    logger.info('Usage: ts-node src/create-email-drafts-from-report.ts [report-file] [template-id] [format]');
    logger.info('Available templates:');
    ALL_TEMPLATES.forEach(t => logger.info(`  - ${t.id}: ${t.name}`));
    process.exit(1);
  }
  
  logger.info(`📊 Reading enrichment report: ${reportPath}`);
  
  // Read report
  const reportData = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));
  
  // Check if it's an array (enrichment report) or single object
  const enrichmentResults = Array.isArray(reportData) ? reportData : [reportData];
  
  logger.info(`Found ${enrichmentResults.length} enriched organizations`);
  
  // Convert to EmailDraftData
  const draftDataList: EmailDraftData[] = enrichmentResults
    .filter(r => r.primaryDecisionMaker && r.primaryDecisionMaker.email)
    .map(r => ({
      orgId: r.orgId,
      orgName: r.orgName,
      website: r.updates?.website || r.website,
      
      primaryDecisionMaker: r.primaryDecisionMaker,
      softwareBuyers: r.softwareBuyers || [],
      
      description: r.description,
      arbeitsbereiche: r.arbeitsbereiche,
      flagshipProjects: r.flagshipProjects,
      
      taetigkeitsfeld: r.updates?.['d0ff2ebd4d3c12b3f1faad65b409a8e578d657a3'],
      legalForm: r.legalForm,
      estimatedStaff: r.estimatedStaff,
    }));
  
  logger.info(`${draftDataList.length} organizations have decision maker emails`);
  
  if (draftDataList.length === 0) {
    logger.warn('No organizations with decision maker emails found');
    process.exit(0);
  }
  
  // Generate drafts
  logger.info(`📧 Generating email drafts...`);
  if (templateId) {
    logger.info(`Using template: ${templateId}`);
  } else {
    logger.info('Auto-selecting best template for each organization');
  }
  
  const drafts = generateBulkEmailDrafts(draftDataList, templateId);
  
  logger.info(`✅ Generated ${drafts.length} email drafts`);
  
  // Show confidence breakdown
  const confidenceCounts = {
    high: drafts.filter(d => d.confidence === 'high').length,
    medium: drafts.filter(d => d.confidence === 'medium').length,
    low: drafts.filter(d => d.confidence === 'low').length,
  };
  
  logger.info(`Confidence breakdown:`);
  logger.info(`  ✅ High: ${confidenceCounts.high}`);
  logger.info(`  ⚠️  Medium: ${confidenceCounts.medium}`);
  logger.info(`  ❌ Low: ${confidenceCounts.low}`);
  
  // Export to file
  const exportContent = exportDrafts(drafts, format);
  
  const timestamp = Date.now();
  const outputDir = path.join(__dirname, 'email-drafts');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const outputFile = path.join(
    outputDir,
    `email-drafts-${timestamp}.${format === 'markdown' ? 'md' : format}`
  );
  
  fs.writeFileSync(outputFile, exportContent);
  
  logger.info(`\n📄 Email drafts saved to: ${outputFile}`);
  
  // Print first draft as preview
  if (drafts.length > 0) {
    const firstDraft = drafts[0];
    logger.info(`\n${'='.repeat(80)}`);
    logger.info(`PREVIEW - First Email Draft`);
    logger.info('='.repeat(80));
    logger.info(`Organization: ${firstDraft.orgName}`);
    logger.info(`To: ${firstDraft.recipientName} <${firstDraft.recipientEmail}>`);
    logger.info(`Template: ${firstDraft.templateName}`);
    logger.info(`Confidence: ${firstDraft.confidence.toUpperCase()}`);
    logger.info('');
    logger.info(`Subject: ${firstDraft.subject}`);
    logger.info('');
    logger.info('Body:');
    logger.info(firstDraft.body);
    logger.info('='.repeat(80));
    
    if (firstDraft.notes.length > 0) {
      logger.info('\nNotes:');
      firstDraft.notes.forEach(note => logger.info(`  ${note}`));
    }
  }
  
  logger.info(`\n✅ Done! Open the file to review all ${drafts.length} email drafts.`);
  logger.info(`\n💡 Tip: You can import the ${format} file into your email client or CRM.`);
}

/**
 * Find the latest enrichment report
 */
function findLatestReport(): string | null {
  const reportsDir = path.join(__dirname, 'reports');
  
  if (!fs.existsSync(reportsDir)) {
    return null;
  }
  
  const files = fs.readdirSync(reportsDir)
    .filter(f => f.startsWith('leadership-enrichment-') && f.endsWith('.json'))
    .map(f => ({
      name: f,
      path: path.join(reportsDir, f),
      mtime: fs.statSync(path.join(reportsDir, f)).mtime,
    }))
    .sort((a, b) => b.mtime.getTime() - a.mtime.getTime());
  
  return files.length > 0 ? files[0].path : null;
}

main().catch(error => {
  logger.error({ error: error.message }, 'Failed to generate email drafts');
  process.exit(1);
});

