/**
 * Email templates for personalized outreach
 * 
 * Available placeholders:
 * - {{orgName}} - Organization name
 * - {{primaryDecisionMaker.name}} - Decision maker full name
 * - {{primaryDecisionMaker.firstName}} - First name only
 * - {{primaryDecisionMaker.lastName}} - Last name only
 * - {{primaryDecisionMaker.salutation}} - Herr/Frau
 * - {{primaryDecisionMaker.role}} - Role/title
 * - {{primaryDecisionMaker.email}} - Email address
 * - {{description}} - AI-generated description
 * - {{arbeitsbereiche}} - Comma-separated work areas
 * - {{arbeitsbereiche[0]}} - First work area
 * - {{flagshipProjects[0]}} - First flagship project
 * - {{taetigkeitsfeld}} - Activity field
 * - {{legalForm}} - Legal form (e.V., gGmbH, etc.)
 * - {{estimatedStaff}} - Estimated staff count
 * - {{website}} - Website URL
 */

export interface EmailTemplate {
  id: string;
  name: string;
  description: string;
  subject: string;
  body: string;
  useCase: string;
}

/**
 * TEMPLATE 1: Initial Contact - Software Focus
 */
export const TEMPLATE_SOFTWARE_FOCUS: EmailTemplate = {
  id: 'software-focus',
  name: 'Initial Contact - Software Focus',
  description: 'For organizations with IT decision makers',
  useCase: 'When software buyers are identified',
  
  subject: 'Digitalisierung {{taetigkeitsfeld}} - AntragPlus für {{orgName}}',
  
  body: `Sehr geehrte/r {{primaryDecisionMaker.salutation}} {{primaryDecisionMaker.lastName}},

als {{primaryDecisionMaker.role}} bei {{orgName}} mit ca. {{estimatedStaff}} Mitarbeitern kennen Sie sicher die Herausforderung: Förderanträge manuell zu bearbeiten kostet wertvolle Zeit, die Ihrem Kerngeschäft fehlt.

{{description}}

Besonders im Bereich {{arbeitsbereiche[0]}} sehen wir, dass Organisationen durchschnittlich 15 Stunden pro Woche mit Antragsverwaltung verbringen. Mit AntragPlus automatisieren Sie:

✓ Antragserstellung und -verwaltung
✓ Verwendungsnachweise
✓ Fristen und Compliance

Viele {{taetigkeitsfeld}}-Träger nutzen unsere Lösung bereits und sparen dabei durchschnittlich 70% Zeit.

Hätten Sie Interesse an einem kurzen 15-minütigen Austausch, um zu sehen, wie AntragPlus konkret für {{orgName}} funktionieren könnte?

Mit freundlichen Grüßen,
[Ihr Name]
[Ihre Position]

P.S. Weitere Informationen finden Sie auch auf unserer Website: [Ihre Website]`
};

/**
 * TEMPLATE 2: Follow-up after initial contact
 */
export const TEMPLATE_FOLLOWUP: EmailTemplate = {
  id: 'followup',
  name: 'Follow-up Email',
  description: 'Second touch after no response',
  useCase: 'Send 3-5 days after initial email',
  
  subject: 'Re: Digitalisierung {{taetigkeitsfeld}} - {{orgName}}',
  
  body: `Sehr geehrte/r {{primaryDecisionMaker.salutation}} {{primaryDecisionMaker.lastName}},

ich hatte Ihnen vergangene Woche bezüglich der Digitalisierung Ihres Antragsmanagements geschrieben.

Ich verstehe, dass Sie als {{primaryDecisionMaker.role}} bei {{orgName}} viel zu tun haben. Deshalb möchte ich es Ihnen einfach machen:

**3 Gründe, warum AntragPlus für {{taetigkeitsfeld}}-Organisationen besonders gut funktioniert:**

1. Speziell für gemeinnützige Organisationen entwickelt
2. DSGVO-konform und Vereins-/Stiftungsrecht-optimiert
3. Durchschnittlich 15 Stunden Zeitersparnis pro Woche

Würde ein kurzer 15-Minuten-Call diese oder nächste Woche passen?

Alternativ können Sie auch direkt einen Termin buchen: [Kalendly-Link]

Mit freundlichen Grüßen,
[Ihr Name]`
};

/**
 * TEMPLATE 3: Project-specific outreach
 */
export const TEMPLATE_PROJECT_FOCUS: EmailTemplate = {
  id: 'project-focus',
  name: 'Project-Specific Outreach',
  description: 'References specific flagship project',
  useCase: 'When flagship projects are found',
  
  subject: '{{flagshipProjects[0]}} - Digitale Unterstützung für {{orgName}}',
  
  body: `Sehr geehrte/r {{primaryDecisionMaker.salutation}} {{primaryDecisionMaker.lastName}},

ich bin auf {{orgName}} und Ihr Projekt "{{flagshipProjects[0]}}" aufmerksam geworden.

{{description}}

Gerade für innovative Projekte wie "{{flagshipProjects[0]}}" ist ein effizientes Antragsmanagement entscheidend. Viele erfolgreiche {{taetigkeitsfeld}}-Projekte scheitern nicht an der Idee, sondern an der Verwaltung.

**Was würde es für "{{flagshipProjects[0]}}" bedeuten, wenn Sie:**
- 70% weniger Zeit für Antragsverwaltung aufwenden
- Alle Fristen automatisch im Blick haben
- Verwendungsnachweise mit 3 Klicks erstellen

Bei anderen {{taetigkeitsfeld}}-Organisationen hat AntragPlus genau das ermöglicht.

Wäre ein kurzer Austausch interessant für Sie?

Mit freundlichen Grüßen,
[Ihr Name]

P.S. Ich habe auch gesehen, dass Sie in den Bereichen {{arbeitsbereiche}} tätig sind - AntragPlus deckt alle diese Bereiche ab.`
};

/**
 * TEMPLATE 4: CEO/Vorstand Focus (Strategic)
 */
export const TEMPLATE_STRATEGIC: EmailTemplate = {
  id: 'strategic',
  name: 'Strategic/CEO Outreach',
  description: 'High-level, ROI-focused message',
  useCase: 'For Vorstand/Geschäftsführung',
  
  subject: 'ROI-Analyse: Digitalisierung bei {{orgName}}',
  
  body: `Sehr geehrte/r {{primaryDecisionMaker.salutation}} {{primaryDecisionMaker.lastName}},

als {{primaryDecisionMaker.role}} von {{orgName}} steht für Sie wahrscheinlich die Frage im Raum: Wie können wir mehr Wirkung erzielen, ohne das Budget zu erhöhen?

{{description}}

**Die Realität bei vielen {{taetigkeitsfeld}}-Organisationen:**
- 20-30% der Arbeitszeit geht für Verwaltung drauf
- Das entspricht bei {{estimatedStaff}} Mitarbeitern ca. {{calculatedCost}} € pro Jahr
- Diese Zeit fehlt im Kerngeschäft

**Die Lösung:**
AntragPlus ermöglicht es {{taetigkeitsfeld}}-Trägern, administrative Aufgaben um 70% zu reduzieren. Das bedeutet:
- Mehr Zeit für Ihre Mission
- Höhere Mitarbeiterzufriedenheit
- Bessere Compliance und weniger Risiko

**Wäre eine ROI-Analyse für {{orgName}} interessant?**

Wir können in 20 Minuten durchrechnen, welches Einsparpotenzial konkret bei Ihnen besteht.

Mit freundlichen Grüßen,
[Ihr Name]
[Ihre Position]`
};

/**
 * TEMPLATE 5: Quick Value Proposition
 */
export const TEMPLATE_QUICK_VALUE: EmailTemplate = {
  id: 'quick-value',
  name: 'Quick Value Proposition',
  description: 'Short, punchy email',
  useCase: 'For busy decision makers',
  
  subject: '15 Stunden pro Woche sparen - {{orgName}}',
  
  body: `{{primaryDecisionMaker.salutation}} {{primaryDecisionMaker.lastName}},

eine kurze Frage: Was würden Sie mit 15 zusätzlichen Stunden pro Woche machen?

Bei {{orgName}} mit {{estimatedStaff}} Mitarbeitern im Bereich {{arbeitsbereiche[0]}} gehen vermutlich viele Stunden für Antragsverwaltung drauf.

**AntragPlus = 70% weniger Verwaltungsaufwand**

Interessiert?
→ Hier 15-Minuten-Call buchen: [Kalendly-Link]

Beste Grüße,
[Ihr Name]

P.S. Speziell für {{taetigkeitsfeld}}-Organisationen entwickelt.`
};

/**
 * All available templates
 */
export const ALL_TEMPLATES: EmailTemplate[] = [
  TEMPLATE_SOFTWARE_FOCUS,
  TEMPLATE_FOLLOWUP,
  TEMPLATE_PROJECT_FOCUS,
  TEMPLATE_STRATEGIC,
  TEMPLATE_QUICK_VALUE,
];

/**
 * Get template by ID
 */
export function getTemplateById(id: string): EmailTemplate | undefined {
  return ALL_TEMPLATES.find(t => t.id === id);
}

/**
 * Get recommended template based on enrichment data
 */
export function getRecommendedTemplate(data: {
  hasSoftwareBuyers: boolean;
  hasFlagshipProjects: boolean;
  isPrimaryDecisionMaker: boolean;
  hasMultipleArbeitsbereiche: boolean;
}): EmailTemplate {
  
  // If software buyer identified → Software focus template
  if (data.hasSoftwareBuyers) {
    return TEMPLATE_SOFTWARE_FOCUS;
  }
  
  // If flagship projects found → Project focus template
  if (data.hasFlagshipProjects) {
    return TEMPLATE_PROJECT_FOCUS;
  }
  
  // If CEO/Vorstand → Strategic template
  if (data.isPrimaryDecisionMaker) {
    return TEMPLATE_STRATEGIC;
  }
  
  // Default: Quick value
  return TEMPLATE_QUICK_VALUE;
}

