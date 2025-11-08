# 📊 Projects Overview - Ready for Merger

## 🎯 Three Projects to Merge

### 1️⃣ **Lead Enricher** 
📁 `AntragPlus_LeadMaschine/lead-enricher/`

**What it does:**
- Discovers nonprofits from CSV lists
- Scrapes websites for information
- Uses AI (GPT-4o-mini) to enrich data
- Extracts leadership, contacts, projects
- Generates German descriptions
- Classifies by Tätigkeitsfeld
- Creates personalized email drafts
- Pushes enriched leads to Pipedrive

**Key Features:**
- ✅ 15+ enrichment scripts
- ✅ Batch processing (80 leads/run)
- ✅ Cost controls (€60 cap)
- ✅ Confidence scoring
- ✅ Review queue for low-confidence
- ✅ Stage gap analysis
- ✅ Automatic deal routing

**Tech Stack:**
- TypeScript + ts-node
- OpenAI GPT-4o-mini
- Playwright (web scraping)
- Cheerio (HTML parsing)
- Pino (logging)
- Zod (schemas)
- Axios + p-queue

---

### 2️⃣ **Pipedrive Sales Sync**
📁 `Pipedrive_Salse/`

**What it does:**
- Syncs Pipedrive deals ↔ Asana tasks
- Real-time webhooks from both platforms
- Scheduled sync every 5 minutes
- Automation rules (timers, assignments)
- Time tracking
- Email draft creation
- Contact & email history sync

**Key Features:**
- ✅ Bidirectional sync
- ✅ Stage ↔ Section mapping
- ✅ Custom automation rules
- ✅ Timer start/stop on section changes
- ✅ Time-to-complete tracking
- ✅ AWS Lambda deployment
- ✅ PostgreSQL tracking

**Tech Stack:**
- TypeScript
- AWS Lambda (Node.js 20.x)
- Serverless Framework
- Undici (HTTP)
- PostgreSQL
- esbuild

---

### 3️⃣ **Base Lead Maschine**
📁 `AntragPlus_LeadMaschine/` (root files)

**What it does:**
- Appears to be an earlier/simpler version
- Basic structure for lead processing

**Status:** 
- ⚠️ Likely superseded by lead-enricher
- Will merge any unique code

---

## 🔄 How They Work Together

```
┌─────────────────────────────────────────────────────────┐
│                    CURRENT WORKFLOW                      │
└─────────────────────────────────────────────────────────┘

Step 1: Lead Enricher
  ├─ Read CSV with org names
  ├─ Scrape websites
  ├─ AI enrichment (descriptions, classification)
  ├─ Extract contacts & leadership
  └─ Push to Pipedrive
           │
           ▼
Step 2: Manual Gap (❌ Problem!)
  ├─ No automatic handoff
  ├─ No Asana sync
  └─ No automation rules
           │
           ▼
Step 3: Pipedrive Sales (separate)
  ├─ Sync Pipedrive → Asana
  ├─ Apply automation rules
  └─ Track time & progress
```

## 🎯 After Merger - Unified Workflow

```
┌─────────────────────────────────────────────────────────┐
│              UNIFIED SALES SOFTWARE                      │
└─────────────────────────────────────────────────────────┘

Step 1: Lead Discovery & Enrichment
  ├─ CSV import or API discovery
  ├─ Website scraping
  ├─ AI enrichment (GPT-4o-mini)
  ├─ Leadership extraction
  ├─ Confidence scoring
  └─ Quality gates
           │
           ▼
Step 2: CRM Push (Automatic)
  ├─ Create Pipedrive deal
  ├─ Set custom fields
  ├─ Route to correct stage
  └─ Trigger sync
           │
           ▼
Step 3: PM Sync (Automatic)
  ├─ Create Asana task
  ├─ Map to correct section
  ├─ Add contacts as comments
  └─ Add email history
           │
           ▼
Step 4: Automation (Automatic)
  ├─ Start timer
  ├─ Assign to team member
  ├─ Set due dates
  ├─ Generate follow-up emails
  └─ Track progress
           │
           ▼
Step 5: Analytics & Reporting
  ├─ Enrichment quality metrics
  ├─ Conversion tracking
  ├─ Time-to-close analysis
  └─ Stage gap detection
```

---

## 📈 Merger Benefits

### Before (3 Separate Projects)
- ❌ Manual handoff between systems
- ❌ Duplicate Pipedrive API code
- ❌ No unified workflow
- ❌ Separate deployments
- ❌ Harder to maintain
- ❌ No end-to-end tracking
- ❌ Limited automation

### After (1 Unified System)
- ✅ Fully automated pipeline
- ✅ Single codebase
- ✅ Shared utilities & APIs
- ✅ One deployment
- ✅ End-to-end tracking
- ✅ Powerful automation
- ✅ Better performance insights
- ✅ Easier to extend

---

## 📊 Feature Matrix

| Feature | Lead Enricher | Pipedrive Sales | Unified |
|---------|--------------|-----------------|---------|
| **Lead Discovery** | ✅ | ❌ | ✅ |
| **AI Enrichment** | ✅ | ❌ | ✅ |
| **Website Scraping** | ✅ | ❌ | ✅ |
| **Leadership Data** | ✅ | ❌ | ✅ |
| **Pipedrive Push** | ✅ (one-way) | ✅ (two-way) | ✅ (two-way) |
| **Asana Sync** | ❌ | ✅ | ✅ |
| **Automation Rules** | ❌ | ✅ | ✅ |
| **Time Tracking** | ❌ | ✅ | ✅ |
| **Email Generation** | ✅ | ✅ | ✅ (enhanced) |
| **Webhooks** | ❌ | ✅ | ✅ |
| **Batch Processing** | ✅ | ❌ | ✅ |
| **Cost Controls** | ✅ | ❌ | ✅ |
| **Quality Gates** | ✅ | ❌ | ✅ |
| **Analytics** | ✅ (basic) | ❌ | ✅ (comprehensive) |
| **AWS Lambda** | ❌ | ✅ | ✅ |

---

## 🗂️ File Count Summary

### Lead Enricher
- **Source files:** 20+ TypeScript files
- **Utilities:** 7 utility modules
- **Scripts:** 15+ operational scripts
- **Reports:** 20+ JSON enrichment reports
- **Documentation:** 15+ MD files

### Pipedrive Sales
- **Source files:** 11 TypeScript files
- **Lambda functions:** 5 handlers
- **Scripts:** 5+ helper scripts
- **Documentation:** 5 MD files

### Total to Merge
- **~35 TypeScript files**
- **~20 documentation files**
- **~20 enrichment reports (historical data)**
- **2 package.json files**
- **2 tsconfig.json files**
- **1 serverless.yml**

---

## 🚀 Ready to Merge?

All three projects are:
- ✅ Well-documented
- ✅ TypeScript-based
- ✅ Actively used
- ✅ Complementary features
- ✅ No major conflicts

**Estimated merger time:** 10-12 hours
**Complexity:** Medium
**Risk:** Low (can keep originals as backup)

---

## 📝 Next Steps

See `MERGER_PLAN.md` for detailed step-by-step instructions!

