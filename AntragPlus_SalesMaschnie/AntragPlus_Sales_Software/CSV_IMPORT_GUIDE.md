# 📄 CSV IMPORT - DEINE SPEZIFISCHEN FELDER

## ✅ DEINE CSV STRUKTUR

### **Felder in deiner CSV:**
```csv
Firmename,Geber,Fördererfahrung,jahr,anschrift,Tätigkeitsfeld,Förderzweck,betrag,empfaengerid
```

### **Field Mapping:**

| CSV Spalte | DB Feld | Typ | Via Enrichment? |
|-----------|---------|-----|-----------------|
| **Firmename** | company_name | Standard | ❌ Aus CSV |
| **anschrift** | address | Standard | ❌ Aus CSV |
| **Tätigkeitsfeld** | tätigkeitsfeld | Standard | ❌ Aus CSV |
| **Geber** | custom_fields.geber | Custom | ❌ Aus CSV |
| **Fördererfahrung** | custom_fields.fördererfahrung | Custom | ❌ Aus CSV |
| **jahr** | custom_fields.jahr | Custom | ❌ Aus CSV |
| **Förderzweck** | custom_fields.förderzweck | Custom | ❌ Aus CSV |
| **betrag** | custom_fields.betrag | Custom | ❌ Aus CSV |
| **empfaengerid** | custom_fields.empfaengerid | Custom | ❌ Aus CSV |

### **Felder via ENRICHMENT geholt:**

| Feld | Quelle | Beschreibung |
|------|--------|--------------|
| **Website** | Tavily Search | Automatisch gefunden |
| **Email** | Web Scraping | Aus Website extrahiert |
| **Phone** | Web Scraping | Aus Website extrahiert |
| **LinkedIn** | Tavily Search | Company profile |
| **Branche** | OpenAI LLM | AI Classification |
| **Rechtsform** | OpenAI LLM | e.V., gGmbH, etc. |
| **Gründungsjahr** | Web Scraping | Aus Website |
| **Mitarbeiter** | OpenAI LLM | Schätzung |
| **Description** | OpenAI LLM | 2-3 Sätze Deutsch |
| **Leadership** | Web Scraping | Vorstand, Geschäftsführung |

---

## 🎯 WORKFLOW

### 1. **CSV Upload**
```
Deine CSV mit 9 Spalten →
  Auto-Detection erkennt:
    ✅ Firmename → company_name
    ✅ anschrift → address
    ✅ Tätigkeitsfeld → tätigkeitsfeld
    ✅ Geber → custom_fields.geber
    ✅ Fördererfahrung → custom_fields.fördererfahrung
    ✅ jahr → custom_fields.jahr
    ✅ Förderzweck → custom_fields.förderzweck
    ✅ betrag → custom_fields.betrag
    ✅ empfaengerid → custom_fields.empfaengerid

  Import → Status: "pending"
```

### 2. **Enrichment**
```
Click "Enrichment starten" →
  Für jeden Lead:
    ✅ Website finden (Tavily)
    ✅ Email scrapen (von Website)
    ✅ Telefon scrapen (von Website)
    ✅ LinkedIn finden (Tavily)
    ✅ Branche klassifizieren (OpenAI)
    ✅ Rechtsform erkennen (OpenAI)
    ✅ Leadership extrahieren (Web Scraping)
    ✅ Description generieren (OpenAI)

  Status: "enriched"
  Confidence: 0-100%
```

### 3. **Approval & Conversion**
```
Approved Lead →
  Contact erstellt mit:
    ✅ Name (aus Leadership oder Generic)
    ✅ Email (enriched)
    ✅ Phone (enriched)
    ✅ Organization (aus CSV)
    ✅ Custom Fields (Geber, Betrag, etc.)

  Deal erstellt mit:
    ✅ Title: "{Firmename} - Qualified Lead"
    ✅ Stage: "Start"
    ✅ Value: betrag (aus CSV!)
    ✅ Contact linked
    ✅ Custom Fields attached
```

---

## 📊 BEISPIEL

### **Input CSV:**
```csv
Firmename,Geber,Fördererfahrung,jahr,anschrift,Tätigkeitsfeld,Förderzweck,betrag,empfaengerid
Deutscher Caritasverband e.V.,Bundesministerium,Ja,2024,Karlstraße 40 Freiburg,Wohlfahrtsverband,Soziale Integration,50000,EMP001
```

### **Nach Import (Status: pending):**
```json
{
  "company_name": "Deutscher Caritasverband e.V.",
  "address": "Karlstraße 40 Freiburg",
  "tätigkeitsfeld": "Wohlfahrtsverband",
  "custom_fields": {
    "geber": "Bundesministerium",
    "fördererfahrung": "Ja",
    "jahr": "2024",
    "förderzweck": "Soziale Integration",
    "betrag": "50000",
    "empfaengerid": "EMP001"
  },
  "status": "pending",
  "confidence": 0,
  "website": null,  ← Wird enriched
  "email": null,    ← Wird enriched
  "phone": null,    ← Wird enriched
  "linkedin_url": null,  ← Wird enriched
  "industry": null,      ← Wird enriched
  "leadership": null     ← Wird enriched
}
```

### **Nach Enrichment (Status: enriched):**
```json
{
  "company_name": "Deutscher Caritasverband e.V.",
  "address": "Karlstraße 40 Freiburg",
  "tätigkeitsfeld": "Wohlfahrtsverband",
  "custom_fields": {
    "geber": "Bundesministerium",
    "fördererfahrung": "Ja",
    "jahr": "2024",
    "förderzweck": "Soziale Integration",
    "betrag": "50000",
    "empfaengerid": "EMP001"
  },
  "website": "https://www.caritas.de",  ✅
  "email": "info@caritas.de",           ✅
  "phone": "+49 761 200-0",             ✅
  "linkedin_url": "...",                ✅
  "industry": "Sozialwesen",            ✅
  "legal_form": "e.V.",                 ✅
  "leadership": [{...}],                ✅
  "description": "...",                 ✅
  "confidence": 0.95,                   ✅
  "status": "enriched"
}
```

### **Nach Approval (Contact + Deal):**
```sql
-- Contact
internal_contacts:
  full_name: "Eva Welskop-Deffaa" (from leadership)
  email: "welskop-deffaa@caritas.de"
  phone: "+49 761 200-123"
  organization_name: "Deutscher Caritasverband e.V."
  custom_fields: {geber, fördererfahrung, ...}

-- Deal
internal_deals:
  title: "Deutscher Caritasverband e.V. - Qualified Lead"
  stage: "Start"
  value: 50000  ← Aus CSV betrag!
  organization_name: "Deutscher Caritasverband e.V."
  tätigkeitsfeld: "Wohlfahrtsverband"
  custom_fields: {geber, förderzweck, ...}
```

---

## 🧪 TEST JETZT

### 1. **Test CSV hochladen:**
```
http://localhost:3001/dashboard/leads

1. Click "CSV hochladen"
2. Upload test-leads.csv (im Root folder erstellt)
3. Field Mapper zeigt:
   ✅ Firmename → company_name (Auto-detected)
   ✅ anschrift → address (Auto-detected)
   ✅ Tätigkeitsfeld → tätigkeitsfeld (Auto-detected)
   ✅ Geber → custom:geber (Auto-detected)
   ✅ betrag → custom:betrag (Auto-detected)
   ...etc
4. Click "Import starten"
5. ✅ 5 Leads imported
```

### 2. **Verify in "Ausstehend" Tab:**
```
Should see:
- Deutscher Caritasverband e.V.
- NABU Deutschland e.V.
- Deutsches Rotes Kreuz
- WWF Deutschland
- Greenpeace e.V.

Alle mit:
  ✅ Firmename
  ✅ anschrift
  ✅ Tätigkeitsfeld
  ✅ Custom Fields (Geber, betrag, etc.)
  ❌ Website (null - needs enrichment)
  ❌ Email (null - needs enrichment)
```

### 3. **Run Enrichment:**
```
Click "Enrichment starten" →
  Backend enriches all 5 leads:
    • Finds websites
    • Scrapes emails, phones
    • Extracts leadership
    • Classifies industry

After ~2-3 minutes:
  ✅ All leads in "Angereichert" or "Review" Tab
  ✅ Website, Email, Phone filled
  ✅ Leadership data added
  ✅ Confidence scores calculated
```

---

## ✅ WAS GEÄNDERT WURDE

### **1. CSVFieldMapper.tsx**
- ✅ Auto-Detection für DEINE Felder (Firmename, anschrift, Geber, etc.)
- ✅ Custom Fields Unterstützung
- ✅ Zeigt was enriched wird (mit 🔍 Icon)

### **2. Upload Route**
- ✅ Mapped DEINE Spaltennamen
- ✅ Speichert custom_fields in JSONB
- ✅ Unterstützt alle 9 Felder

### **3. Lead Repository**
- ✅ Custom Fields Handling
- ✅ JSONB Storage für Geber, Fördererfahrung, etc.

### **4. Lead Service**
- ✅ Custom Fields in bulk import
- ✅ Preserves all data

### **5. Test CSV**
- ✅ `test-leads.csv` erstellt mit deinen Feldern
- ✅ 5 Beispiel-Organisationen
- ✅ Alle 9 Spalten

---

## 🎯 WICHTIG ZU WISSEN

### **Aus CSV (Sofort verfügbar):**
- ✅ Firmename
- ✅ anschrift  
- ✅ Tätigkeitsfeld
- ✅ Geber, Fördererfahrung, jahr, Förderzweck, betrag, empfaengerid

### **Via Enrichment (Nach "Enrichment starten"):**
- 🔍 Website
- 🔍 Email
- 🔍 Telefon
- 🔍 LinkedIn
- 🔍 Branche
- 🔍 Rechtsform
- 🔍 Gründungsjahr
- 🔍 Mitarbeiter
- 🔍 Leadership Team
- 🔍 Description

### **Custom Fields Nutzung:**
Alle deine speziellen Felder (Geber, betrag, etc.) werden in `custom_fields` JSONB gespeichert und sind:
- ✅ Sichtbar in Lead Detail Panel
- ✅ Übertragen zu Contact
- ✅ Übertragen zu Deal
- ✅ Durchsuchbar
- ✅ Exportierbar

---

## 🚀 TESTE JETZT MIT DEINER CSV!

```bash
# Test CSV liegt hier:
cat AntragPlus_Sales_Software/test-leads.csv

# Oder nutze deine eigene CSV mit genau diesen Spalten:
# Firmename, Geber, Fördererfahrung, jahr, anschrift, 
# Tätigkeitsfeld, Förderzweck, betrag, empfaengerid
```

**Upload und teste dass alle Felder korrekt erkannt werden!** 🎯

