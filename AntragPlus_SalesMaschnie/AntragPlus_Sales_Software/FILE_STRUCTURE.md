# 📁 File Structure - AntragPlus Sales Software

## 🎯 Current Status

### ✅ Created (Infrastructure)
```
AntragPlus_Sales_Software/
├── package.json                    ✅ Unified dependencies
├── tsconfig.json                   ✅ TypeScript config
├── serverless.yml                  ✅ AWS Lambda config
├── .gitignore                      ✅ Ignore rules
├── env.example                     ✅ Environment template
├── setup.sh                        ✅ Automated setup script
│
├── README.md                       ✅ Main documentation
├── QUICK_START.md                  ✅ Quick start guide
├── SETUP_INSTRUCTIONS.md           ✅ Detailed setup
├── MIGRATION_COMPLETE.md           ✅ Migration summary
├── FILE_STRUCTURE.md               ✅ This file
│
├── src/
│   ├── index.ts                    ✅ Main orchestrator
│   ├── shared/
│   │   └── config.ts               ✅ Unified configuration
│   ├── automation/
│   │   └── index.ts                ✅ Automation placeholder
│   ├── lead/                       📦 To be copied by setup.sh
│   └── sync/                       📦 To be copied by setup.sh
│
└── data/
    ├── leads/.gitkeep              ✅ Placeholder
    ├── reports/.gitkeep            ✅ Placeholder
    └── logs/.gitkeep               ✅ Placeholder
```

---

## 📦 Files to be Copied by setup.sh

### From Lead Enricher (`AntragPlus_LeadMaschine/lead-enricher/`)

**Main Scripts:**
```
src/lead/
├── enrich-pipedrive.ts             📋 Core enrichment pipeline
├── enrich-single.ts                📋 Single org enrichment
├── enrich-with-leadership.ts       📋 Leadership extraction
├── extract-leadership.ts           📋 Leadership parsing
├── create-email-drafts-from-report.ts  📋 Email generation
├── generate-email-drafts.ts        📋 Direct email generation
├── analyze-stage-gaps.ts           📋 Stage analysis
├── inspect-pipedrive.ts            📋 Data inspection
├── verify-data-completeness.ts     📋 Quality checks
├── move-deals-by-tatigkeitsfeld.ts 📋 Stage routing
├── move-id46-deals.ts              📋 Specific movements
├── move-non-matching-deals.ts      📋 Deal cleanup
├── re-enrich-gaps.ts               📋 Gap re-enrichment
├── search.ts                       📋 Website discovery
├── store.ts                        📋 Cache & queue
└── index.ts                        📋 Main entry
```

**Utilities:**
```
src/lead/utils/
├── http.ts                         📋 HTTP client with retry
├── llm.ts                          📋 OpenAI integration
├── logger.ts                       📋 Pino logger
├── robots.ts                       📋 Robots.txt parser
├── schemas.ts                      📋 Zod schemas
├── tavily.ts                       📋 Tavily search API
└── text.ts                         📋 Text extraction
```

**Prompts & Templates:**
```
src/lead/prompts/
└── enrichment.ts                   📋 AI prompts

src/lead/templates/
└── email-templates.ts              📋 Email templates
```

**Sync Client:**
```
src/lead/sync/
└── pipedrive.ts                    📋 Pipedrive client
```

**Data:**
```
data/leads/
└── leads.csv                       📋 Sample leads

src/lead/data/
└── leads.csv                       📋 Input leads
```

---

### From Pipedrive Sales (`Pipedrive_Salse/`)

**Main Sync Engine:**
```
src/sync/
├── index.ts (sync.ts)              📋 Main sync handler
├── backfill.ts                     📋 Initial migration
├── pdWebhook.ts                    📋 Pipedrive webhooks
├── asanaWebhook.ts                 📋 Asana webhooks
├── cleanup.ts                      📋 Cleanup function
├── asana.ts                        📋 Asana API client
├── pipedrive.ts                    📋 Pipedrive API client
├── db.ts                           📋 Database operations
├── mapping.ts                      📋 Field mappings
├── automation-rules.ts             📋 Automation rules
├── env.ts                          📋 Environment config
└── util.ts                         📋 Utilities
```

**Helper Scripts (root):**
```
./
├── add-full-emails.js              📋 Email sync helper
├── create-email-drafts.js          📋 Draft creation
├── test-automation.js              📋 Automation test
├── test-time-tracking.js           📋 Time tracking test
├── check-custom-fields.js          📋 Field checker
└── create-time-field.js            📋 Field creator
```

---

### Documentation

**Lead Enricher Docs:**
```
docs/lead-enricher/
├── README.md                       📋 Lead enricher guide
├── B2B-SALES-STRATEGY.md          📋 Sales strategy
├── ENRICHMENT-GUIDE.md            📋 Enrichment guide
├── ENRICHMENT-STATUS.md           📋 Status tracking
├── IMPLEMENTATION-COMPLETE.md     📋 Implementation notes
├── LEADERSHIP-ENRICHMENT.md       📋 Leadership guide
├── EMAIL-SYSTEM-READY.md          📋 Email system
├── FIELDS-SUMMARY.md              📋 Field summary
└── ... (15+ more docs)
```

**Sync Docs:**
```
docs/sync/
├── README.md                       📋 Sync guide
├── DEPLOYMENT_SUMMARY.md          📋 Deployment info
├── SYNC_CAPABILITIES.md           📋 Capabilities
└── SETUP_CHECKLIST.md             📋 Setup checklist
```

---

## 🔄 After Setup Completion

Once `setup.sh` runs successfully, the structure will be:

```
AntragPlus_Sales_Software/
├── 📦 All infrastructure files      ✅ Already created
├── 📦 All source files              ✅ Copied by setup.sh
├── 📦 All documentation             ✅ Copied by setup.sh
├── 📦 node_modules/                 ✅ Installed by npm
├── 📦 dist/                         ✅ Built by tsc
└── 📦 .env                          ✅ Copied/created
```

**Total Files:**
- ~35 TypeScript source files
- ~20 documentation files
- ~10 helper scripts
- ~5 configuration files
- **Total: ~70 files**

---

## 📊 File Size Estimate

- Source code: ~500 KB
- Documentation: ~300 KB
- node_modules: ~150 MB
- dist (compiled): ~1 MB
- **Total project: ~152 MB**

---

## 🎯 Next Action

Run the setup script to copy all files:

```bash
cd /Users/roberttepass/Desktop/Agenti_Build/AntragPlus_SalesMaschnie/AntragPlus_Sales_Software
chmod +x setup.sh
./setup.sh
```

This will populate all the 📋 marked files automatically!

