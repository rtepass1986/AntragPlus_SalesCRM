# 🎯 LEAD-TO-CRM WORKFLOW DESIGN

## 📋 DEIN GEWÜNSCHTER WORKFLOW

```
1. Leads Import (CSV oder Pipedrive Pull)
   ↓
2. Automatic Enrichment (alle Felder)
   ↓
3. User Review & Approval
   ↓
4. Move to Pipeline + Create Contacts
```

---

## 🤔 ENRICHMENT OPTIONEN - ENTSCHEIDUNGSHILFE

### Option A: **Automatisch + Review Queue** ⭐ EMPFOHLEN

```
Upload CSV → 
  Auto-Enrichment startet (Background) → 
    Status: "enriching" → 
      Status: "pending_review" → 
        USER REVIEW (Approve/Reject) → 
          Status: "approved" → 
            Sync to Pipedrive (Create Deal + Person + Org)
```

**Vorteile:**
- ✅ User sieht immer die Ergebnisse bevor sie in Pipedrive gehen
- ✅ Quality Control - keine schlechten Daten in CRM
- ✅ Batch Approval möglich (alle auf einmal)
- ✅ Kosten-Kontrolle (User entscheidet was enriched wird)

**Workflow:**
1. Upload CSV → Leads in Status "pending"
2. Click "Enrichment starten" → Alle pending Leads werden enriched
3. Nach Enrichment → Status "pending_review" (neue Queue)
4. Review Page zeigt alle enriched Leads
5. User approved einzeln oder batch
6. Approved Leads → Auto-Sync to Pipedrive

---

### Option B: **Voll-Automatisch** 

```
Upload CSV → 
  Auto-Enrichment (sofort) → 
    Auto-Sync to Pipedrive (sofort) → 
      Done
```

**Vorteile:**
- ✅ Schnell, keine User-Interaktion nötig
- ✅ Gut für vertrauenswürdige Quellen

**Nachteile:**
- ⚠️ Keine Quality Control
- ⚠️ Schlechte Enrichments landen direkt in Pipedrive
- ⚠️ Kosten laufen unkontrolliert

---

### Option C: **Manual Enrichment**

```
Upload CSV → 
  Leads in Liste → 
    User wählt Leads aus → 
      Click "Enrichment starten" → 
        Status "enriching" → 
          Status "enriched" → 
            User approved → 
              Sync to Pipedrive
```

**Vorteile:**
- ✅ Volle Kontrolle
- ✅ Kosten-Kontrolle

**Nachteile:**
- ⚠️ Viel manuelle Arbeit
- ⚠️ Langsam bei vielen Leads

---

## 🌟 MEINE EMPFEHLUNG: **Option A + Hybrid**

### **Smart Workflow:**

```
┌─────────────────────────────────────────────────┐
│  1. IMPORT                                      │
│     • CSV Upload                                │
│     • Pipedrive Pull (optional)                 │
│     Status: "pending"                           │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│  2. AUTO-ENRICHMENT (Background Queue)          │
│     • Tavily Search (Website, Contacts)         │
│     • OpenAI LLM (Industry, Description)        │
│     • Leadership Extraction                      │
│     Status: "enriching" → "enriched"            │
│     Confidence Score: 0-100%                    │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│  3. SMART ROUTING                               │
│     IF confidence >= 80%:                       │
│       → Status: "auto_approved"                 │
│       → Skip review, direkt zu Pipedrive        │
│                                                 │
│     IF confidence < 80%:                        │
│       → Status: "pending_review"                │
│       → User muss reviewen                      │
│                                                 │
│     IF enrichment failed:                       │
│       → Status: "failed"                        │
│       → Zeige in "Failed" Tab                   │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│  4. REVIEW QUEUE (nur für < 80% confidence)    │
│     • User sieht alle Fields                    │
│     • Edit möglich                              │
│     • Approve oder Reject                       │
│     • Bulk Actions möglich                      │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│  5. SYNC TO PIPEDRIVE                           │
│     A. Create Organization (falls nicht exists) │
│     B. Create Person/Contact                    │
│     C. Create Deal in "Qualified Lead" Stage    │
│     D. Add Note mit Enrichment Details          │
│     E. Update Lead: synced_to_pipedrive = true  │
│     F. Status: "synced"                         │
└─────────────────────────────────────────────────┘
```

---

## 🎯 EMPFOHLENE IMPLEMENTIERUNG

### **Status Flow:**
```
pending → enriching → enriched → 
  ├─ auto_approved (>80% confidence) → synced
  └─ pending_review (<80% confidence) → 
      ├─ approved → synced
      └─ rejected → archived
```

### **UI Flow:**

#### Leads Page Tabs:
1. **Alle** - Alle Leads
2. **Ausstehend** - Warten auf Enrichment (pending)
3. **In Bearbeitung** - Wird enriched (enriching)
4. **Review** - Brauchen Approval (pending_review) ⭐
5. **Angereichert** - Fertig & approved (enriched, auto_approved)
6. **Synchronisiert** - In Pipedrive (synced)
7. **Fehlgeschlagen** - Errors (failed, rejected)

#### Actions:
- **"Enrichment starten"** - Für pending Leads
- **"Approve"** - Für pending_review Leads
- **"Approve All (High Confidence)"** - Batch für >80%
- **"Zu Pipedrive exportieren"** - Manual sync
- **"Re-enrich"** - Für failed Leads

---

## 📊 FIELDS ZU ENRICHEN

### **Basic Fields** (Tavily + Web Scraping):
- ✅ Website
- ✅ Email (generisch + Leadership)
- ✅ Phone (generisch + Leadership)
- ✅ Address (HQ)
- ✅ LinkedIn URL

### **Organization Details** (LLM):
- ✅ Industry / Branche
- ✅ Tätigkeitsfeld (specific)
- ✅ Legal Form (e.V., gGmbH, Stiftung)
- ✅ Founded Year
- ✅ Employees Estimate
- ✅ Description (2-3 Sätze auf Deutsch)
- ✅ Flagship Projects
- ✅ Arbeitsbereiche

### **Leadership Team** (Web Scraping + LLM):
- ✅ Vorstand / Geschäftsführung
- ✅ Names, Roles, Email, Phone
- ✅ Authority Levels
- ✅ Can Sign Contracts Flag

### **Tags & Classification**:
- ✅ Auto-Tags aus Content
- ✅ Nonprofit Type
- ✅ Focus Areas

---

## 🔄 SYNC TO PIPEDRIVE LOGIC

### When Lead approved:

#### 1. **Create/Update Organization:**
```typescript
Organization in Pipedrive:
  - Name: company_name
  - Website: website
  - Address: full address
  - Custom Fields:
    - Tätigkeitsfeld
    - Legal Form
    - Description
```

#### 2. **Create Person/Contact:**
```typescript
// Option A: Create PRIMARY contact from Leadership
Person in Pipedrive:
  - Name: leadership[0].name (Vorstand/CEO)
  - Email: leadership[0].email
  - Phone: leadership[0].phone
  - Organization: Link to org
  - Custom Fields:
    - Role: leadership[0].role_display

// Option B: Create GENERIC contact
Person:
  - Name: "Kontakt bei {Organization}"
  - Email: organization email
  - Phone: organization phone
```

**Frage an dich:** Soll ich:
- **A)** Primary Leadership Person als Kontakt erstellen?
- **B)** Generic "Allgemeiner Kontakt" erstellen?
- **C)** Beide erstellen (Leadership Team + Generic)?

#### 3. **Create Deal:**
```typescript
Deal in Pipedrive:
  - Title: "{Organization Name} - Lead"
  - Value: 0 (oder default value)
  - Stage: "Qualified Lead generiert" (oder andere Stage)
  - Organization: Link to org
  - Person: Link to person
  - Custom Fields:
    - Confidence Score
    - Enrichment Date
    - Source: "Lead Enrichment"
```

#### 4. **Add Note:**
```typescript
Note to Deal:
  - Enrichment Summary
  - All Leadership Team
  - Description
  - Key Projects
  - Confidence Score
```

---

## 💡 MEINE EMPFEHLUNG

### **Bester Workflow für dich:**

**Phase 1: Upload & Enrichment**
```typescript
1. User uploaded CSV
2. Auto-Enrichment startet (Background)
3. Status: pending → enriching → enriched
4. Confidence berechnet (0-100%)
```

**Phase 2: Smart Review**
```typescript
IF confidence >= 80%:
  → Auto-Approve
  → Direct to Pipedrive
  → Notification: "5 Leads automatisch approved"

IF confidence < 80%:
  → Review Queue
  → User sieht alle Fields
  → User kann editieren
  → User approved oder rejected
```

**Phase 3: Sync to Pipedrive**
```typescript
For each approved Lead:
  1. Create/Update Organization
  2. Create Leadership Person (Primary Decision Maker)
  3. Create Deal in "Qualified Lead" Stage
  4. Add Enrichment Note
  5. Mark Lead as "synced"
```

---

## 🎯 MEINE FRAGEN AN DICH:

### 1. **Enrichment Trigger:**
- **A)** Auto-Enrichment direkt nach CSV Upload? 
- **B)** Manual - User clicked "Enrichment starten"?
- **👍 Empfehlung: B** - Mehr Kontrolle

### 2. **Approval Process:**
- **A)** Alle Leads brauchen Approval?
- **B)** Nur Low-Confidence (<80%) Leads brauchen Review?
- **👍 Empfehlung: B** - Spart Zeit

### 3. **Pipedrive Contact Creation:**
- **A)** Erstelle Vorstand/CEO als Primary Contact?
- **B)** Erstelle Generic "Kontakt bei {Org}"?
- **C)** Erstelle beide (Leadership + Generic)?
- **👍 Empfehlung: A** - Bessere Qualität

### 4. **Deal Value:**
- **A)** Default 0€ für alle Leads?
- **B)** Estimated Value basierend auf Org Size?
- **C)** User muss eingeben vor Approval?
- **👍 Empfehlung: B** - Automatisch aber sinnvoll

### 5. **Target Stage in Pipedrive:**
- **A)** "Qualified Lead generiert"?
- **B)** Andere Stage?
- **👍 Empfehlung: A** - Wie aktuell im Backend

---

## 🚀 WAS ICH JETZT IMPLEMENTIERE:

Basierend auf meiner Empfehlung baue ich:

1. **Review Queue Tab** auf Leads Page
2. **Lead Approval UI** (einzeln + batch)
3. **Edit Lead Modal** (vor Approval)
4. **Sync to Pipedrive Service**
5. **Progress Tracking**
6. **Status Flow Management**

**Sage mir deine Präferenzen für die 5 Fragen oben, oder ich implementiere mit meinen Empfehlungen!** 👍

