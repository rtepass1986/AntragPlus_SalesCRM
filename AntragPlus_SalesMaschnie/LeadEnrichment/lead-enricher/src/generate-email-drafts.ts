/**
 * Email Draft Generator
 * 
 * Generates personalized email drafts from enrichment data
 */

import { EmailTemplate, ALL_TEMPLATES, getRecommendedTemplate } from './templates/email-templates';
import type { LeadershipRole } from './utils/schemas';

export interface EmailDraftData {
  // Organization
  orgName: string;
  orgId: number;
  website?: string;
  
  // Primary decision maker
  primaryDecisionMaker: LeadershipRole | null;
  softwareBuyers: LeadershipRole[];
  
  // AI-generated context
  description?: string;
  arbeitsbereiche?: string[];
  flagshipProjects?: string[];
  
  // Classification
  taetigkeitsfeld?: string;
  legalForm?: string;
  estimatedStaff?: number;
}

export interface GeneratedEmailDraft {
  orgId: number;
  orgName: string;
  
  // Recipient
  recipientName: string;
  recipientEmail: string;
  recipientRole: string;
  
  // Email content
  subject: string;
  body: string;
  
  // Template used
  templateId: string;
  templateName: string;
  
  // Metadata
  generatedAt: string;
  confidence: 'high' | 'medium' | 'low';
  notes: string[];
}

/**
 * Generate email draft from enrichment data
 */
export function generateEmailDraft(
  data: EmailDraftData,
  templateId?: string
): GeneratedEmailDraft | null {
  
  // Validate we have minimum required data
  if (!data.primaryDecisionMaker?.email) {
    return null;
  }
  
  // Select template
  let template: EmailTemplate;
  if (templateId) {
    const t = ALL_TEMPLATES.find(t => t.id === templateId);
    if (!t) {
      throw new Error(`Template not found: ${templateId}`);
    }
    template = t;
  } else {
    // Auto-select template based on data
    template = getRecommendedTemplate({
      hasSoftwareBuyers: data.softwareBuyers.length > 0,
      hasFlagshipProjects: (data.flagshipProjects?.length || 0) > 0,
      isPrimaryDecisionMaker: true,
      hasMultipleArbeitsbereiche: (data.arbeitsbereiche?.length || 0) > 1,
    });
  }
  
  // Prepare template variables
  const variables = prepareTemplateVariables(data);
  
  // Generate subject and body
  const subject = populateTemplate(template.subject, variables);
  const body = populateTemplate(template.body, variables);
  
  // Calculate confidence
  const confidence = calculateConfidence(data);
  
  // Collect notes/warnings
  const notes = collectNotes(data, template);
  
  return {
    orgId: data.orgId,
    orgName: data.orgName,
    
    recipientName: data.primaryDecisionMaker.name,
    recipientEmail: data.primaryDecisionMaker.email,
    recipientRole: data.primaryDecisionMaker.role_display,
    
    subject,
    body,
    
    templateId: template.id,
    templateName: template.name,
    
    generatedAt: new Date().toISOString(),
    confidence,
    notes,
  };
}

/**
 * Prepare template variables from enrichment data
 */
function prepareTemplateVariables(data: EmailDraftData): Record<string, any> {
  const dm = data.primaryDecisionMaker;
  
  // Parse name into parts
  const nameParts = dm?.name.split(' ') || [];
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || nameParts[0] || '';
  
  // Determine salutation (Herr/Frau) - simple heuristic
  const salutation = determineSalutation(dm?.name || '', dm?.role_display || '');
  
  // Map Tätigkeitsfeld ID to display name
  const taetigkeitsfeldMap: Record<string, string> = {
    '45': 'Kinder- und Jugendhilfe',
    '46': 'Soziale Arbeit',
    '47': 'Umwelt- und Klimaschutz',
  };
  
  // Map Legal Form to display
  const legalFormMap: Record<string, string> = {
    'eingetragener_verein': 'e.V.',
    'ggmbh': 'gGmbH',
    'gug': 'gUG',
    'stiftung': 'Stiftung',
  };
  
  // Calculate estimated cost (for strategic template)
  const avgSalary = 35000; // Average nonprofit salary
  const adminPercentage = 0.25; // 25% time on admin
  const calculatedCost = data.estimatedStaff 
    ? Math.round(data.estimatedStaff * avgSalary * adminPercentage)
    : null;
  
  return {
    // Organization
    orgName: data.orgName,
    website: data.website || '',
    
    // Primary Decision Maker
    'primaryDecisionMaker.name': dm?.name || '',
    'primaryDecisionMaker.firstName': firstName,
    'primaryDecisionMaker.lastName': lastName,
    'primaryDecisionMaker.salutation': salutation,
    'primaryDecisionMaker.role': dm?.role_display || 'Ansprechpartner',
    'primaryDecisionMaker.email': dm?.email || '',
    'primaryDecisionMaker.phone': dm?.phone || '',
    
    // Context
    description: data.description || '',
    arbeitsbereiche: data.arbeitsbereiche?.join(', ') || '',
    'arbeitsbereiche[0]': data.arbeitsbereiche?.[0] || 'Ihrem Tätigkeitsbereich',
    'arbeitsbereiche[1]': data.arbeitsbereiche?.[1] || '',
    'flagshipProjects[0]': data.flagshipProjects?.[0] || '',
    'flagshipProjects[1]': data.flagshipProjects?.[1] || '',
    
    // Classification
    taetigkeitsfeld: data.taetigkeitsfeld ? taetigkeitsfeldMap[data.taetigkeitsfeld] || data.taetigkeitsfeld : 'Ihrer Branche',
    legalForm: data.legalForm ? legalFormMap[data.legalForm] || data.legalForm : '',
    estimatedStaff: data.estimatedStaff || '20-50',
    
    // Calculated
    calculatedCost: calculatedCost ? calculatedCost.toLocaleString('de-DE') : '150.000',
  };
}

/**
 * Populate template with variables
 */
function populateTemplate(template: string, variables: Record<string, any>): string {
  let result = template;
  
  // Replace all {{variable}} placeholders
  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{{${key}}}`;
    result = result.split(placeholder).join(value || '');
  }
  
  // Clean up any remaining empty conditionals or double spaces
  result = result.replace(/\s+/g, ' ').trim();
  result = result.replace(/\n\s*\n\s*\n/g, '\n\n'); // Max 2 newlines
  
  return result;
}

/**
 * Determine salutation from name and role
 */
function determineSalutation(name: string, role: string): string {
  const nameLower = name.toLowerCase();
  const roleLower = role.toLowerCase();
  
  // Female indicators
  if (
    nameLower.includes('frau') ||
    roleLower.includes('geschäftsführerin') ||
    roleLower.includes('vorsitzende') ||
    roleLower.includes('leiterin')
  ) {
    return 'Frau';
  }
  
  // Male indicators
  if (
    nameLower.includes('herr') ||
    roleLower.includes('geschäftsführer') ||
    roleLower.includes('vorsitzender') ||
    roleLower.includes('leiter')
  ) {
    return 'Herr';
  }
  
  // Common female first names
  const femaleNames = ['steffi', 'anna', 'maria', 'petra', 'sabine', 'julia', 'lisa', 'katharina', 'christina'];
  const firstName = nameLower.split(' ')[0];
  if (femaleNames.some(fn => firstName.includes(fn))) {
    return 'Frau';
  }
  
  // Default: gender-neutral
  return 'Sehr geehrte Damen und Herren';
}

/**
 * Calculate confidence level for email
 */
function calculateConfidence(data: EmailDraftData): 'high' | 'medium' | 'low' {
  let score = 0;
  
  // Has email
  if (data.primaryDecisionMaker?.email) score += 30;
  
  // Has description
  if (data.description) score += 20;
  
  // Has Arbeitsbereiche
  if (data.arbeitsbereiche && data.arbeitsbereiche.length > 0) score += 15;
  
  // Has flagship projects
  if (data.flagshipProjects && data.flagshipProjects.length > 0) score += 15;
  
  // Has Tätigkeitsfeld
  if (data.taetigkeitsfeld) score += 10;
  
  // Has estimated staff
  if (data.estimatedStaff) score += 10;
  
  if (score >= 80) return 'high';
  if (score >= 50) return 'medium';
  return 'low';
}

/**
 * Collect notes/warnings about the email
 */
function collectNotes(data: EmailDraftData, template: EmailTemplate): string[] {
  const notes: string[] = [];
  
  // Missing data warnings
  if (!data.description) {
    notes.push('⚠️ No description available - email may lack context');
  }
  
  if (!data.arbeitsbereiche || data.arbeitsbereiche.length === 0) {
    notes.push('⚠️ No Arbeitsbereiche found - generic fallback used');
  }
  
  if (!data.flagshipProjects || data.flagshipProjects.length === 0) {
    if (template.id === 'project-focus') {
      notes.push('⚠️ Project-focused template but no projects found');
    }
  }
  
  if (!data.estimatedStaff) {
    notes.push('ℹ️ Estimated staff unknown - using generic range');
  }
  
  // Salutation check
  const salutation = determineSalutation(
    data.primaryDecisionMaker?.name || '',
    data.primaryDecisionMaker?.role_display || ''
  );
  if (salutation === 'Sehr geehrte Damen und Herren') {
    notes.push('⚠️ Could not determine gender - using gender-neutral salutation');
  }
  
  // Quality check
  if (!data.primaryDecisionMaker?.phone) {
    notes.push('ℹ️ No phone number - follow-up may be email-only');
  }
  
  return notes;
}

/**
 * Generate drafts for multiple organizations
 */
export function generateBulkEmailDrafts(
  dataList: EmailDraftData[],
  templateId?: string
): GeneratedEmailDraft[] {
  const drafts: GeneratedEmailDraft[] = [];
  
  for (const data of dataList) {
    const draft = generateEmailDraft(data, templateId);
    if (draft) {
      drafts.push(draft);
    }
  }
  
  return drafts;
}

/**
 * Export drafts to various formats
 */
export function exportDrafts(drafts: GeneratedEmailDraft[], format: 'json' | 'csv' | 'markdown'): string {
  switch (format) {
    case 'json':
      return JSON.stringify(drafts, null, 2);
      
    case 'csv':
      return exportToCsv(drafts);
      
    case 'markdown':
      return exportToMarkdown(drafts);
      
    default:
      throw new Error(`Unknown format: ${format}`);
  }
}

function exportToCsv(drafts: GeneratedEmailDraft[]): string {
  const headers = [
    'Organization',
    'Recipient Name',
    'Recipient Email',
    'Recipient Role',
    'Subject',
    'Body',
    'Template',
    'Confidence',
    'Generated At',
  ];
  
  const rows = drafts.map(d => [
    d.orgName,
    d.recipientName,
    d.recipientEmail,
    d.recipientRole,
    d.subject,
    d.body.replace(/\n/g, ' ').replace(/"/g, '""'), // Escape for CSV
    d.templateName,
    d.confidence,
    d.generatedAt,
  ]);
  
  return [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');
}

function exportToMarkdown(drafts: GeneratedEmailDraft[]): string {
  let md = '# Email Drafts\n\n';
  md += `Generated: ${new Date().toLocaleString('de-DE')}\n`;
  md += `Total: ${drafts.length} emails\n\n`;
  md += '---\n\n';
  
  for (const draft of drafts) {
    md += `## ${draft.orgName}\n\n`;
    md += `**To:** ${draft.recipientName} (${draft.recipientRole})\n`;
    md += `**Email:** ${draft.recipientEmail}\n`;
    md += `**Template:** ${draft.templateName}\n`;
    md += `**Confidence:** ${draft.confidence.toUpperCase()}\n\n`;
    
    if (draft.notes.length > 0) {
      md += `**Notes:**\n`;
      draft.notes.forEach(note => md += `- ${note}\n`);
      md += '\n';
    }
    
    md += `**Subject:** ${draft.subject}\n\n`;
    md += '**Body:**\n\n';
    md += '```\n';
    md += draft.body;
    md += '\n```\n\n';
    md += '---\n\n';
  }
  
  return md;
}

