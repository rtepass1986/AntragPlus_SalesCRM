# Pipedrive Enrichment - Fields Summary

## 🎯 Fields Being Enriched (9 Total)

### 1️⃣ **Website** (`website`)
- **Source**: Tavily search
- **Method**: Searches for official organization website
- **Filters**: Prefers .org/.de domains, excludes social media
- **Status**: 2,070 organizations missing (100%)

### 2️⃣ **LinkedIn** (`linkedin`)
- **Source**: Tavily search
- **Method**: Searches specifically for LinkedIn company pages
- **Filters**: Only linkedin.com/company/ URLs accepted
- **Status**: 2,069 organizations missing (99.95%)

### 3️⃣ **Address** (`address`)
- **Source**: Website scraping (Impressum/Kontakt pages)
- **Method**: Extracts address from website text
- **Format**: Street, PLZ, City
- **Status**: Already 84% filled, but will enrich missing ones

### 4️⃣ **Contact Emails**
- **Source**: Website scraping
- **Method**: Extracts email addresses from website
- **Filters**: Excludes Gmail, Yahoo, Hotmail, etc.
- **Stored in**: 
  1. Person (contact) record in Pipedrive (updates existing only)
  2. Organization note for easy reference
- **Behavior**: 
  - Updates existing contact linked to organization
  - Only updates if contact has no email yet
  - Skips if no contact exists (all deals have contacts pre-assigned)
- **Limit**: Up to 10 emails per organization

### 5️⃣ **Contact Phones**
- **Source**: Website scraping
- **Method**: Extracts phone numbers from website
- **Format**: German phone format (+49 or 0...)
- **Stored in**: 
  1. Person (contact) record in Pipedrive (updates existing only)
  2. Organization note for easy reference
- **Behavior**: 
  - Updates existing contact linked to organization
  - Only updates if contact has no phone yet
  - Skips if no contact exists (all deals have contacts pre-assigned)
- **Limit**: Up to 10 phones per organization

### 6️⃣ **Industry** (`industry`)
- **Source**: AI classification (GPT-4o-mini)
- **Method**: Analyzes research context about organization
- **Examples**: "Bildung", "Soziales", "Umwelt", "Jugend", "Kultur"
- **Status**: 2,070 organizations missing (100%)

### 7️⃣ **Employee Count** (`employee_count`)
- **Source**: AI estimation
- **Method**: Estimates FTE employees from research
- **Format**: Integer
- **Status**: 2,067 organizations missing (99.86%)

### 8️⃣ **Annual Revenue** (`annual_revenue`)
- **Source**: AI estimation
- **Method**: Estimates annual budget/revenue in EUR
- **Format**: Number (EUR)
- **Status**: 2,070 organizations missing (100%)

### 9️⃣ **Tätigkeitsfeld** (`d0ff2ebd4d3c12b3f1faad65b409a8e578d657a3`)
- **Source**: AI classification
- **Method**: Classifies main activity field
- **Options**: 
  - Bildung
  - Soziales
  - Kinder und Jugend
  - Umwelt und Nachhaltigkeit
  - Gesundheit
  - Kultur und Kunst
  - Sport
  - Integration
  - Entwicklungshilfe
  - Wissenschaft
- **Status**: 2,067 organizations missing (99.86%)

### 🔟 **Description/Summary** (Added as Note)
- **Source**: AI generation
- **Method**: Generates 2-3 sentence German summary
- **Content**: What the organization does and their mission
- **Stored**: As a Pipedrive note attached to the organization
- **Status**: Most organizations have no notes

---

## 📊 Enrichment Workflow

```
1. Search for website (if missing)
   ↓
2. Scrape website for address and contacts
   ↓
3. Search for LinkedIn (if missing)
   ↓
4. Research organization via Tavily
   ↓
5. AI analyzes research and generates:
   - Industry
   - Employee count
   - Annual revenue
   - Tätigkeitsfeld
   - Description
   ↓
6. Update Pipedrive organization fields
   ↓
7. Create note with description + contacts
```

---

## ⚙️ Configuration

### Environment Variables
```bash
OPENAI_API_KEY=sk-...          # Required for AI enrichment
PIPEDRIVE_API_TOKEN=...        # Required
TAVILY_API_KEY=...             # Required
DRY_RUN=false                  # Set to true for testing
MAX_ORGS=50                    # How many orgs to process
```

### Rate Limits
- **2 seconds** between organizations
- **Built-in retry** for Tavily and OpenAI
- **Respects robots.txt** when scraping

### Cost Estimates
- **Tavily**: ~5-10 API calls per org (search + research)
- **OpenAI**: ~1 API call per org (~500 tokens)
- **Estimated cost**: ~€0.02-0.05 per organization

---

## 🚫 Fields NOT Being Enriched

### Custom Fields (Excluded by User Request)
- Software_Budget
- Antraege_pro_Jahr
- Digitalisierungsgrad
- Strukturierte_Finanzdaten
- Verwendungsnachweise
- KPI_Erfassung
- Antragsformate
- Dokumentenablage
- And all other custom fields...

### Standard Fields (Not Needed)
- Geo coordinates (lat/long) - Can be derived from address later
- Picture - Not available from research
- Country code - Can be set to DE manually if needed
- All structured address components (street, city, etc.) - Already have main address field

---

## 🎯 Expected Results

After enrichment, each organization will have:
- ✅ Official website URL
- ✅ LinkedIn company page (if exists)
- ✅ Physical address
- ✅ Industry classification
- ✅ Employee count estimate
- ✅ Annual revenue estimate
- ✅ Activity field (Tätigkeitsfeld)
- ✅ Note with description and contacts (emails, phones)

---

## 🔒 Data Quality & Safety

- **Only fills empty fields** - Never overwrites existing data
- **Dry run mode** - Test before making changes
- **Detailed logging** - Every action is logged
- **JSON reports** - Full audit trail of all changes
- **Rate limiting** - Respectful of API limits
- **Robots.txt** - Respects website crawling rules
- **Email filtering** - Excludes personal/freemail addresses

