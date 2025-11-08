# ✅ KORREKTER LEAD WORKFLOW

## 🎯 DEIN AKTUELLER WORKFLOW

```
┌─────────────────────────────────────────────────┐
│  PHASE 1: IMPORT                                │
│  • CSV Upload                                   │
│  • Leads Table: Status "pending"                │
└─────────────────────────────────────────────────┘
              ↓ (User clicks "Enrichment starten")
┌─────────────────────────────────────────────────┐
│  PHASE 2: ENRICHMENT                            │
│  • Tavily: Website, Email, Phone                │
│  • OpenAI: Industry, Tätigkeitsfeld             │
│  • Web Scrape: Leadership Team                  │
│  • Status: "enriching" → "enriched"             │
│  • Confidence: 0-100%                           │
└─────────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────────┐
│  PHASE 3: USER REVIEW & APPROVAL                │
│  • User sieht alle enriched Fields              │
│  • Edit möglich                                 │
│  • Approve oder Reject                          │
│  • Status: "enriched" → "approved"              │
└─────────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────────┐
│  PHASE 4: CREATE CONTACT (INTERNAL)             │
│  • Lead → Contact Conversion                    │
│  • Neuer Eintrag in "contacts" Table            │
│  • NOT synced to Pipedrive!                     │
│  • Contact hat alle enriched Fields             │
└─────────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────────┐
│  PHASE 5: CREATE DEAL IN PIPELINE               │
│  • Auto-Create Deal for Contact                 │
│  • Stage: "Start" (1st Stage)                   │
│  • Deal Title: "{Company Name} - Lead"          │
│  • Link to Contact                              │
│  • Zeige in Pipeline Board                      │
└─────────────────────────────────────────────────┘
```

---

## 📊 DATENBANKFLUSS

### Leads Table → Contacts Table → Deals Table

```sql
-- 1. Lead (enriched)
leads:
  id: 1
  company_name: "Deutscher Caritasverband"
  status: "approved"
  confidence: 0.95
  leadership: [{name: "Eva Welskop-Deffaa", role: "Präsidentin", ...}]
  ...

-- 2. Contact wird erstellt (internal)
contacts:
  id: 101
  source_lead_id: 1  ← Link zurück zum Lead
  full_name: "Eva Welskop-Deffaa"
  email: "welskop-deffaa@caritas.de"
  phone: "+49 761 200-123"
  organization: "Deutscher Caritasverband"
  title: "Präsidentin"
  source: "lead_enrichment"
  
-- 3. Deal wird erstellt (internal)
deals:
  id: 501
  title: "Deutscher Caritasverband - Lead"
  contact_id: 101  ← Link to Contact
  organization: "Deutscher Caritasverband"
  stage: "Start"  ← Erste Stage!
  value: 2000  ← Estimated
  status: "open"
  source: "lead_enrichment"
```

---

## 🎯 WAS ICH IMPLEMENTIERE

### 1. **Lead Approval UI**
- Review Tab mit allen enriched Leads
- Side-by-side view (vor/nach Enrichment)
- Edit Button
- Approve/Reject Actions
- Batch Approve

### 2. **Lead → Contact Conversion Service**
```typescript
async function convertLeadToContact(lead: Lead): Promise<Contact> {
  // Nimm Primary Leadership Person ODER Generic
  const primaryPerson = lead.leadership?.[0] || {
    name: `Kontakt bei ${lead.companyName}`,
    email: lead.email,
    phone: lead.phone,
  }
  
  return {
    full_name: primaryPerson.name,
    email: primaryPerson.email,
    phone: primaryPerson.phone,
    organization: lead.companyName,
    title: primaryPerson.role_display || null,
    source: 'lead_enrichment',
    source_lead_id: lead.id,
    custom_fields: {
      leadership_role: primaryPerson.role,
      can_sign_contracts: primaryPerson.can_sign_contracts,
      authority_level: primaryPerson.authority_level,
      lead_confidence: lead.confidence,
      enrichment_date: lead.enrichmentDate,
    }
  }
}
```

### 3. **Auto-Create Deal Service**
```typescript
async function createDealForContact(contact: Contact, lead: Lead): Promise<Deal> {
  return {
    title: `${lead.companyName} - Qualified Lead`,
    stage: 'Start',  // ← Deine erste Stage
    status: 'open',
    value: estimateDealValue(lead),  // Based on org size
    contact_id: contact.id,
    organization: lead.companyName,
    description: lead.description,
    source: 'lead_enrichment',
    custom_fields: {
      tätigkeitsfeld: lead.tätigkeitsfeld,
      industry: lead.industry,
      confidence_score: lead.confidence,
      leadership_team: lead.leadership,
      arbeitsbereiche: lead.arbeitsbereiche,
    },
    notes: generateEnrichmentNote(lead),
  }
}
```

### 4. **Pipeline Stage "Start"**
Brauche ich eine neue Stage "Start" oder hast du die schon?

---

## 🚀 IMPLEMENTIERUNG - NEXT STEPS

Ich baue jetzt:

✅ **Lead Approval System**
- Review Tab
- Approve/Reject Buttons
- Batch Actions
- Edit Lead Modal

✅ **Conversion Services**
- `convertLeadToContact()` API
- `createDealForContact()` API
- Auto-chaining

✅ **New Tables (if needed)**
- contacts table (internal, separate from Pipedrive persons)
- deals table (internal pipeline)
- Or reuse existing?

**Frage:** Soll ich:
- **A)** Neue `internal_contacts` und `internal_deals` Tables erstellen?
- **B)** Die bestehenden `deals` und `persons` Tables nutzen?

**Empfehlung A** - Trennung von Pipedrive Data und internen Leads!

Soll ich loslegen? 🚀

