/**
 * Leadership Extraction for German Nonprofits
 * 
 * Extracts Vorstand, Geschäftsführung, and other decision-makers
 * from nonprofit websites using AI analysis
 */

import { queuedGet } from "./utils/http";
import * as cheerio from "cheerio";
import { logger } from "./utils/logger";
import { isAllowed } from "./utils/robots";
import { chromium } from "playwright";
import { callLLM } from "./utils/llm";
import type { 
  LeadershipRole, 
  OrganizationStructure, 
  LegalForm,
  GermanNonprofitRole,
  AILeadershipResponse,
  LeadershipExtractionResult
} from "./utils/schemas";

/**
 * Main function: Extract complete leadership structure
 */
export async function extractLeadership(
  orgName: string,
  website: string,
  openaiKey: string
): Promise<LeadershipExtractionResult> {
  logger.info(`Extracting leadership for: ${orgName}`);
  
  // Step 1: Find relevant pages
  const leadershipPages = await findLeadershipPages(website);
  
  if (leadershipPages.length === 0) {
    logger.warn(`No leadership pages found for ${orgName}`);
    return {
      success: false,
      leadership: [],
      org_structure: {
        legal_form: null,
        total_staff: null,
        has_professional_management: false,
      },
      confidence: 0,
      extraction_method: "impressum",
      raw_data: "",
    };
  }
  
  // Step 2: Scrape all relevant pages
  const scrapedData = await scrapeLeadershipPages(leadershipPages);
  
  if (!scrapedData || scrapedData.length === 0) {
    logger.warn(`Failed to scrape leadership pages for ${orgName}`);
    return {
      success: false,
      leadership: [],
      org_structure: { legal_form: null, total_staff: null, has_professional_management: false },
      confidence: 0,
      extraction_method: "impressum",
      raw_data: "",
    };
  }
  
  // Step 3: Use AI to extract structured leadership data
  const aiExtraction = await extractLeadershipWithAI(orgName, scrapedData, openaiKey);
  
  // Step 4: Enrich with additional data
  const enrichedLeadership = await enrichLeadershipData(aiExtraction.leadership_team, website);
  
  return {
    success: enrichedLeadership.length > 0,
    leadership: enrichedLeadership,
    org_structure: {
      legal_form: aiExtraction.legal_form,
      total_staff: estimateStaffSize(aiExtraction),
      has_professional_management: hasProfessionalManagement(aiExtraction),
    },
    confidence: aiExtraction.confidence,
    extraction_method: "ai_research",
    raw_data: scrapedData,
  };
}

/**
 * Find pages that likely contain leadership information
 */
async function findLeadershipPages(website: string): Promise<string[]> {
  const baseUrl = website.replace(/\/$/, '');
  
  // Common German nonprofit leadership page URLs
  const possiblePaths = [
    '/vorstand',
    '/team',
    '/ueber-uns',
    '/about',
    '/wer-wir-sind',
    '/organisation',
    '/struktur',
    '/impressum',
    '/kontakt',
    '/geschaeftsfuehrung',
    '/leitung',
    '/mitarbeiter',
    '/ansprechpartner',
    '/beirat',
    '/kuratorium',
    '/aufsichtsrat',
  ];
  
  const pagesToCheck = possiblePaths.map(path => baseUrl + path);
  const validPages: string[] = [];
  
  // Check which pages exist
  for (const url of pagesToCheck) {
    try {
      if (await isAllowed(url)) {
        const html = await queuedGet(url);
        if (html && html.length > 500) { // Has meaningful content
          validPages.push(url);
        }
      }
    } catch (error) {
      // Page doesn't exist, skip
    }
  }
  
  logger.info(`Found ${validPages.length} leadership pages`);
  return validPages;
}

/**
 * Scrape leadership pages and extract text
 */
async function scrapeLeadershipPages(urls: string[]): Promise<string> {
  let combinedText = '';
  
  for (const url of urls) {
    try {
      let html: string | null = await queuedGet(url);
      
      // Fallback to JS rendering if needed
      if (!html) {
        html = await renderPage(url);
      }
      
      if (!html) continue;
      
      const $ = cheerio.load(html);
      
      // Remove navigation, footer, scripts
      $('nav, footer, script, style, .cookie, .navigation').remove();
      
      // Extract relevant sections
      const relevantSections = [
        'main',
        '[class*="team"]',
        '[class*="vorstand"]',
        '[class*="leadership"]',
        '[id*="team"]',
        '[id*="vorstand"]',
        '.impressum',
        '.contact',
      ];
      
      let pageText = '';
      relevantSections.forEach(selector => {
        const content = $(selector).text();
        if (content && content.length > 100) {
          pageText += '\n\n' + content;
        }
      });
      
      // Fallback: get all body text
      if (pageText.length < 200) {
        pageText = $('body').text();
      }
      
      combinedText += `\n\n=== ${url} ===\n${pageText}`;
      
    } catch (error: any) {
      logger.warn(`Failed to scrape ${url}: ${error.message}`);
    }
  }
  
  // Clean up text
  combinedText = combinedText
    .replace(/\s+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  
  return combinedText.slice(0, 12000); // Limit to avoid token overflow
}

/**
 * Use AI to extract structured leadership data
 */
async function extractLeadershipWithAI(
  orgName: string,
  websiteContent: string,
  openaiKey: string
): Promise<AILeadershipResponse> {
  const prompt = `Du bist ein Experte für die Analyse deutscher gemeinnütziger Organisationen.

Organisation: ${orgName}

Website-Inhalte (Team/Vorstand/Geschäftsführung Seiten):
${websiteContent}

AUFGABE: Extrahiere ALLE Führungspersonen und erstelle eine vollständige Organisationsstruktur.

WICHTIG - Rollen-Hierarchie für deutsche Nonprofits:

**HÖCHSTE AUTORITÄT (Vertragsunterzeichnung):**
1. e.V. Struktur:
   - Vorstandsvorsitzende/r (1. Vorsitzende/r) → role: "vorstandsvorsitzende"
   - Stellv. Vorsitzende/r (2. Vorsitzende/r) → role: "stellv_vorsitzende"
   - Weitere Vorstandsmitglieder → role: "vorstand"
   - Schatzmeister/in (Budget!) → role: "schatzmeister"
   - Schriftführer/in → role: "schriftfuehrer"

2. gGmbH/GmbH Struktur:
   - Geschäftsführer/in → role: "geschaeftsfuehrer"
   - Kaufmännische Geschäftsführung → role: "kaufmaennische_geschaeftsfuehrung"
   - Technische Geschäftsführung → role: "technische_geschaeftsfuehrung"

**OPERATIVE FÜHRUNG:**
- Geschäftsleitung → role: "geschaeftsleitung"
- Bereichsleitung → role: "bereichsleitung"
- Verwaltungsleitung → role: "verwaltungsleitung"

**SOFTWARE-KÄUFER (SEHR WICHTIG!):**
- IT-Leitung / CIO → role: "it_leitung"
- Digitalisierung / Digital Lead → role: "digitalisierung"
- Finanzleitung / CFO → role: "finanzleitung"

**GOVERNANCE:**
- Aufsichtsrat → role: "aufsichtsrat"
- Kuratorium → role: "kuratorium"
- Beirat → role: "beirat"

AUTHORITY LEVELS:
- Level 1 = Höchste Autorität (Vorstandsvorsitz, Geschäftsführung, Schatzmeister)
- Level 2 = Operative Führung (Bereichsleitung, IT-Leitung)
- Level 3 = Governance/Beratung (Beirat, Kuratorium)

EXTRAHIERE für jede Person:
- Vollständiger Name
- Genaue Rollenbezeichnung (wie auf Website)
- Normalisierte Rolle (aus Liste oben)
- E-Mail (falls vorhanden)
- Telefon (falls vorhanden)
- Abteilung/Bereich
- Authority Level (1-3)
- Kann Verträge unterschreiben? (ja/nein)

Antworte NUR mit JSON:
{
  "legal_form": "eingetragener_verein" | "ggmbh" | "gug" | "stiftung" | "other" | null,
  "leadership_team": [
    {
      "name": "Dr. Maria Schmidt",
      "role": "1. Vorsitzende",
      "role_normalized": "vorstandsvorsitzende",
      "email": "m.schmidt@example.org",
      "phone": "+49 123 456789",
      "department": "Vorstand",
      "authority_level": 1,
      "can_sign_contracts": true
    },
    {
      "name": "Thomas Weber",
      "role": "Leitung Digitalisierung",
      "role_normalized": "digitalisierung",
      "email": "t.weber@example.org",
      "phone": null,
      "department": "Verwaltung",
      "authority_level": 2,
      "can_sign_contracts": false
    }
  ],
  "organizational_notes": "Hinweise zur Struktur, Besonderheiten, etc.",
  "confidence": 0.0-1.0,
  "gaps": ["Keine E-Mail für Vorstand", "Schatzmeister nicht gefunden"]
}

WICHTIG:
- Extrahiere ALLE genannten Personen
- Priorisiere Vorstand/Geschäftsführung
- Achte auf E-Mail-Adressen (sehr wertvoll!)
- Markiere Software-Entscheider (IT, Digitalisierung)
- Wenn unsicher: confidence < 0.7`;

  try {
    const response = await callLLM(prompt, {
      model: 'gpt-4o',
      temperature: 0.1,
      max_tokens: 2000,
    });
    
    const parsed = JSON.parse(response) as AILeadershipResponse;
    return parsed;
    
  } catch (error: any) {
    logger.error(`AI extraction failed: ${error.message}`);
    return {
      legal_form: null,
      leadership_team: [],
      organizational_notes: "",
      confidence: 0,
      gaps: ["AI extraction failed"],
    };
  }
}

/**
 * Enrich leadership data with additional searches
 */
async function enrichLeadershipData(
  rawLeadership: AILeadershipResponse['leadership_team'],
  website: string
): Promise<LeadershipRole[]> {
  const enriched: LeadershipRole[] = [];
  
  for (const person of rawLeadership) {
    const role: LeadershipRole = {
      name: person.name,
      role: person.role_normalized,
      role_display: person.role,
      email: person.email || null,
      phone: person.phone || null,
      linkedin: null, // TODO: Could search LinkedIn
      authority_level: person.authority_level,
      can_sign_contracts: person.can_sign_contracts,
      budget_authority: isBudgetAuthority(person.role_normalized),
      tenure_start: null,
      additional_roles: [],
      department: person.department || null,
      source_url: website,
      confidence: 0.85, // High confidence from website data
    };
    
    enriched.push(role);
  }
  
  return enriched;
}

/**
 * Helper: Render page with JavaScript
 */
async function renderPage(url: string): Promise<string | null> {
  try {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ userAgent: "LeadEnricher/1.0" });
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 });
    const html = await page.content();
    await browser.close();
    return html;
  } catch {
    return null;
  }
}

/**
 * Helper: Estimate staff size from leadership structure
 */
function estimateStaffSize(extraction: AILeadershipResponse): number | null {
  const leadershipCount = extraction.leadership_team.length;
  
  // Rough heuristic
  if (leadershipCount >= 10) return 50;
  if (leadershipCount >= 5) return 20;
  if (leadershipCount >= 3) return 10;
  if (leadershipCount >= 1) return 5;
  
  return null;
}

/**
 * Helper: Check if org has professional management
 */
function hasProfessionalManagement(extraction: AILeadershipResponse): boolean {
  return extraction.leadership_team.some(
    p => p.role_normalized === 'geschaeftsfuehrer' ||
         p.role_normalized === 'geschaeftsleitung'
  );
}

/**
 * Helper: Check if role has budget authority
 */
function isBudgetAuthority(role: GermanNonprofitRole): boolean {
  return [
    'vorstandsvorsitzende',
    'geschaeftsfuehrer',
    'schatzmeister',
    'kaufmaennische_geschaeftsfuehrung',
    'finanzleitung',
  ].includes(role);
}

/**
 * Helper: Identify primary decision maker
 */
export function identifyPrimaryDecisionMaker(
  leadership: LeadershipRole[]
): LeadershipRole | null {
  // Priority order
  const priorities: GermanNonprofitRole[] = [
    'geschaeftsfuehrer',
    'vorstandsvorsitzende',
    'kaufmaennische_geschaeftsfuehrung',
    'stellv_vorsitzende',
  ];
  
  for (const priorityRole of priorities) {
    const found = leadership.find(l => l.role === priorityRole);
    if (found) return found;
  }
  
  // Fallback: highest authority level with email
  const withEmail = leadership
    .filter(l => l.email)
    .sort((a, b) => a.authority_level - b.authority_level);
  
  return withEmail[0] || null;
}

/**
 * Helper: Identify software buyers/evaluators
 */
export function identifySoftwareBuyers(
  leadership: LeadershipRole[]
): LeadershipRole[] {
  return leadership.filter(l => 
    l.role === 'it_leitung' ||
    l.role === 'digitalisierung' ||
    l.role === 'verwaltungsleitung' ||
    l.role === 'geschaeftsfuehrer' ||
    l.role === 'vorstandsvorsitzende'
  );
}

/**
 * Build complete organization structure
 */
export function buildOrganizationStructure(
  orgId: number,
  orgName: string,
  extraction: LeadershipExtractionResult
): OrganizationStructure {
  const leadership = extraction.leadership;
  
  return {
    org_id: orgId,
    org_name: orgName,
    legal_form: extraction.org_structure.legal_form || 'other',
    leadership,
    structure_type: determineStructureType(leadership),
    decision_making_style: extraction.org_structure.legal_form === 'eingetragener_verein' 
      ? 'democratic' 
      : 'top_down',
    primary_decision_maker: identifyPrimaryDecisionMaker(leadership),
    budget_approvers: leadership.filter(l => l.budget_authority),
    technical_evaluators: identifySoftwareBuyers(leadership),
    last_verified: new Date().toISOString(),
    completeness_score: calculateCompletenessScore(leadership),
    source_urls: leadership.map(l => l.source_url),
  };
}

function determineStructureType(leadership: LeadershipRole[]): "hierarchical" | "flat" | "matrix" {
  if (leadership.length >= 10) return "matrix";
  if (leadership.length >= 5) return "hierarchical";
  return "flat";
}

function calculateCompletenessScore(leadership: LeadershipRole[]): number {
  if (leadership.length === 0) return 0;
  
  let score = 0;
  let maxScore = leadership.length * 5;
  
  leadership.forEach(person => {
    score += 1; // Has person
    if (person.email) score += 2; // Email is very valuable
    if (person.phone) score += 1;
    if (person.linkedin) score += 1;
  });
  
  return Math.round((score / maxScore) * 100);
}

