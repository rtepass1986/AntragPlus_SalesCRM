# 🚀 AntragPlus Sales Software

**Comprehensive sales automation platform** combining lead discovery, AI-powered enrichment, CRM synchronization, and workflow automation.

---

## 🎯 What It Does

### 1. **Lead Discovery & Enrichment** 
- Discovers nonprofits from CSV lists or web searches
- Scrapes websites for detailed information
- Uses AI (GPT-4o-mini) to generate descriptions and classify organizations
- Extracts leadership data, contact information, and flagship projects
- Estimates organization size and budget
- Quality gates with confidence scoring

### 2. **CRM Integration**
- Pushes enriched leads directly to Pipedrive
- Bidirectional sync between Pipedrive and Asana
- Real-time webhook handling
- Automatic stage/section mapping
- Custom field synchronization

### 3. **Workflow Automation**
- Automatic timer start/stop on stage changes
- Task assignment rules
- Due date automation
- Email draft generation
- Time-to-complete tracking

### 4. **Analytics & Reporting**
- Stage gap analysis
- Data completeness checks
- Enrichment quality metrics
- Conversion tracking

---

## 📁 Project Structure

```
AntragPlus_Sales_Software/
├── src/
│   ├── lead/              # Lead discovery & enrichment
│   │   ├── enrich-pipedrive.ts
│   │   ├── enrich-with-leadership.ts
│   │   ├── create-email-drafts-from-report.ts
│   │   ├── analyze-stage-gaps.ts
│   │   ├── search.ts
│   │   ├── store.ts
│   │   ├── prompts/
│   │   ├── templates/
│   │   ├── utils/
│   │   └── sync/
│   │
│   ├── sync/              # Pipedrive ↔ Asana sync
│   │   ├── index.ts       # Main sync handler
│   │   ├── backfill.ts    # Initial migration
│   │   ├── pdWebhook.ts   # Pipedrive webhooks
│   │   ├── asanaWebhook.ts # Asana webhooks
│   │   ├── cleanup.ts
│   │   ├── asana.ts       # Asana API client
│   │   ├── pipedrive.ts   # Pipedrive API client
│   │   ├── db.ts          # Database operations
│   │   ├── mapping.ts     # Field mappings
│   │   └── automation-rules.ts
│   │
│   ├── automation/        # Automation engine (future)
│   │   └── index.ts
│   │
│   └── shared/            # Shared utilities
│       ├── config.ts
│       └── utils/
│
├── data/                  # Data files
│   ├── leads/            # Input CSV files
│   ├── reports/          # Enrichment reports
│   └── logs/             # Run logs
│
├── docs/                  # Documentation
│   ├── lead-enricher/
│   └── sync/
│
├── package.json
├── tsconfig.json
├── serverless.yml
└── .env
```

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Create `.env` file:

```env
# Pipedrive
PIPEDRIVE_API_TOKEN=your_token_here

# Asana
ASANA_CLIENT_ID=1211767256476624
ASANA_CLIENT_SECRET=cd476c0d2493fa6a4a78980b98648cfe
ASANA_ACCESS_TOKEN=your_token_here
ASANA_WORKSPACE_ID=308803216953534

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/pipedrive_sync

# OpenAI (for lead enrichment)
OPENAI_API_KEY=your_key_here

# Tavily (for web search)
TAVILY_API_KEY=your_key_here

# Security
WEBHOOK_SECRET=generate_random_secret
```

### 3. Build

```bash
npm run build
```

---

## 📋 Usage

### Lead Enrichment

```bash
# Enrich leads from Pipedrive
npm run lead:enrich

# Dry run (no updates)
npm run lead:enrich:dry

# Extract leadership data
npm run lead:leadership

# Generate email drafts
npm run lead:emails

# Analyze stage gaps
npm run lead:analyze

# Inspect Pipedrive data
npm run lead:inspect

# Verify data completeness
npm run lead:verify
```

### Sync Operations

```bash
# Initial backfill (Pipedrive → Asana)
npm run sync:backfill

# Test sync
npm run sync:test

# Clean up Asana tasks
npm run sync:cleanup
```

### Deployment

```bash
# Deploy to AWS Lambda (dev)
npm run deploy

# Deploy to production
npm run deploy:prod
```

---

## 🔧 Configuration

### Lead Enrichment Config

Edit `src/shared/config.ts`:

```typescript
export const LEAD_CONFIG = {
  batch: {
    maxLeadsPerRun: 80,
    monthlyLimit: 1500,
    costCapEur: 60
  },
  confidence: {
    enrichmentMin: 0.7,
    sizeMin: 0.6
  },
  categories: [
    "Kinder_und_Jugendhilfe",
    "Umwelt_BNE",
    "Bildung_Demokratie",
    // ... more categories
  ]
};
```

### Sync Config

Edit `src/sync/mapping.ts`:

```typescript
// Stages to sync
export const STAGES_TO_SYNC = [16, 18, 9, 22, 10, 13, 15, 11, 12];

// Stage to section mapping
export const PIPEDRIVE_TO_ASANA_SECTION = {
  16: '1211768109183595',  // 1.Follow Up Call
  18: '1211755208914016',  // 2.Follow Up
  // ... more mappings
};
```

---

## 🤖 Automation Rules

Automation rules are defined in `src/sync/automation-rules.ts`:

```typescript
{
  id: 'rule_001',
  name: 'Follow Up Call - Start Timer, Set Dates and Assign',
  trigger: {
    type: 'section_changed',
    sectionGid: ASANA_SECTIONS.FOLLOW_UP_CALL
  },
  actions: [
    { type: 'start_timer' },
    { type: 'set_dates', params: { ... } },
    { type: 'assign_user', params: { ... } }
  ]
}
```

---

## 📊 Features

### Lead Enrichment
- ✅ Website discovery & scraping
- ✅ AI-powered German descriptions
- ✅ Organization classification (Tätigkeitsfeld)
- ✅ Leadership extraction (names, roles, LinkedIn)
- ✅ Contact extraction (email, phone)
- ✅ Arbeitsbereiche identification
- ✅ Flagship projects extraction
- ✅ Size estimation (employees, budget)
- ✅ Confidence scoring
- ✅ Review queue for low-confidence items
- ✅ Batch processing with cost controls

### Sync & Integration
- ✅ Bidirectional Pipedrive ↔ Asana sync
- ✅ Real-time webhooks
- ✅ Stage ↔ Section mapping
- ✅ Custom field synchronization
- ✅ Notes/description sync
- ✅ Contact & email history sync
- ✅ Duplicate prevention

### Automation
- ✅ Timer start/stop on section changes
- ✅ Automatic task assignment
- ✅ Due date automation
- ✅ Time-to-complete tracking
- ✅ Email draft generation
- ✅ Stage-based routing

---

## 🔗 API Endpoints (After Deployment)

- `POST /webhook/pipedrive` - Pipedrive webhook
- `POST /webhook/asana` - Asana webhook

---

## 📈 Workflow

```
1. Lead Discovery
   ├─ CSV import or API search
   ├─ Website scraping
   └─ Initial data collection
        ↓
2. AI Enrichment
   ├─ GPT-4o-mini analysis
   ├─ Classification
   ├─ Description generation
   └─ Confidence scoring
        ↓
3. CRM Push
   ├─ Create Pipedrive deal
   ├─ Set custom fields
   └─ Route to correct stage
        ↓
4. Sync to PM
   ├─ Create Asana task
   ├─ Map to section
   └─ Add contacts & emails
        ↓
5. Automation
   ├─ Start timer
   ├─ Assign team member
   ├─ Set dates
   └─ Generate follow-ups
        ↓
6. Analytics
   ├─ Track progress
   ├─ Measure quality
   └─ Report gaps
```

---

## 🛠️ Development

```bash
# Run in development mode
npm run dev

# Build TypeScript
npm run build

# Run tests
npm test

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix
```

---

## 📝 License

MIT

---

## 👥 Support

For issues or questions, contact the AntragPlus team.

