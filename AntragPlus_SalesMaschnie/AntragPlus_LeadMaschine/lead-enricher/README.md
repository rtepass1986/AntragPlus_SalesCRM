# Lead Enricher — README

A clean, reproducible pipeline for ingesting nonprofit leads from CSV, enriching them with website signals and LLM outputs, classifying by domain (e.g., Umwelt/BNE, Kinder & Jugendhilfe), estimating size, and preparing for CRM/PM sync (Pipedrive + Asana).

This document tells you what's already implemented, how to run it, and exactly what to do next.

---

## 1) What's implemented

**Core**

* TypeScript project scaffold with strict schemas (`zod`)
* CSV ingest (simple list of org names; optional `seed_domain` planned)
* Website discovery stub + contact extraction pipeline (structure in place; domain search provider to be plugged in)
* HTML fetch with retry, queueing, and respectful rate limiting
* Minimal robots awareness and a Playwright fallback renderer for JS-heavy pages
* Email/phone extraction utilities
* LLM enrichment and size estimation with enforced JSON output and versioned prompts
* Confidence gating with review queue and auto-pause rule
* Run logs and lightweight idempotency cache

**Quality & Governance**

* Fixed category taxonomy (v1.2), multilabel support with one primary
* Confidence thresholds (Enrichment ≥ 0.7, Size ≥ 0.6)
* Cost and batch caps defined (80 leads/run; hard cap 60 € per run)
* Basic GDPR posture: org-level data only, raw data retention window, suppression-ready structure

**Files of note**

```
src/
  index.ts                 # Orchestrates the batch pipeline
  search.ts                # Website + contacts extraction (domain search stub)
  store.ts                 # Idempotency cache, review queue, run logs
  utils/
    schemas.ts             # Zod schemas for enrichment/size/lead records
    llm.ts                 # OpenAI calls with JSON-only response handling
    http.ts                # Axios client + rate limiting + retry helpers
    robots.ts              # Minimal robots.txt check
    text.ts                # Email/phone extraction helpers
    logger.ts              # Pino logger
  prompts/
    enrichment.ts          # Enrichment prompt
  data/
    leads.csv (example)    # Input list of nonprofit names
logs/                      # Run logs (JSONL)
reviews/                   # Low-confidence/review-needed items (JSONL)
config.ts                  # Thresholds, caps, taxonomy, LLM settings
```

---

## 2) Prerequisites

* Node.js ≥ 20, npm
* Playwright will download a browser binary on first run
* API keys you plan to use:

  * `OPENAI_API_KEY`
  * Domain search provider (e.g., Tavily/SerpAPI) — to be added in the next step
  * Later: `PIPEDRIVE_API_TOKEN`, `ASANA_PAT`, `ASANA_PROJECT_ID`

---

## 3) Install

```bash
# From the project root
npm i
# If you haven't yet:
npm i typescript ts-node zod papaparse axios cheerio dotenv pino p-queue openai playwright pino-pretty tldts validator
npx tsc --init
```

Populate `.env`:

```env
OPENAI_API_KEY=sk-...
# reserved for later steps:
PIPEDRIVE_API_TOKEN=
ASANA_PAT=
ASANA_PROJECT_ID=
TAVILY_API_KEY=
```

---

## 4) Configuration

`config.ts` holds the main knobs:

```ts
export const CONFIG = {
  batch: { maxLeadsPerRun: 80, monthlyLimit: 1500, costCapEur: 60 },
  confidence: { enrichmentMin: 0.7, sizeMin: 0.6 },
  categories: [
    "Kinder_und_Jugendhilfe","Umwelt_BNE","Bildung_Demokratie","Gesundheit_Pflege",
    "Integration_Migration","Kultur_Sport","Armut_Soziales","Wissenschaft_Forschung",
    "Internationales_Entwicklung","Technologie_Digitalisierung"
  ],
  storage: { rawDataRetentionDays: 60 },
  llm: { model: "gpt-4o-mini", temperature: 0.2, tokenLimit: 4000 },
};
```

Prompts are versioned and enforced to return JSON:

* `src/prompts/enrichment.ts` → `enrichment@v2` + `size@v1`

---

## 5) Running a batch

1. Put organization names into `src/data/leads.csv` (one per line).

   * Optional near-term enhancement: add CSV with headers `company_name,seed_domain`. The current runner expects a single column of names; we'll switch to header parsing when domain search is wired.

2. Execute:

```bash
npm run dev
```

or

```bash
npx ts-node src/index.ts
```

3. Observe:

* Console logs: success/review/fail statuses per org
* JSONL run logs in `src/logs/`
* Review cases with full payloads in `src/reviews/YYYY-MM-DD.jsonl`

**Auto-pause rule:** if > 15% of leads fall below confidence thresholds, the run reports and you should review the flagged items before the next batch.

---

## 6) Data outputs (shape)

Each successful record adheres to `LeadRecord` and includes:

* `company_name`, `website` (if found), `emails`, `phones`
* `enrichment` object:

  * `summary`, `categories` (from fixed taxonomy), `keywords` (≤ 15),
  * `outreach_tone`, `suggested_hook`, optional `confidence`
* `size` object:

  * `staff_range`, `budget_range_eur`, `confidence`, `signals`
* `source_signals` (hints collected during scraping), `source_urls` (audit trail)

Low-confidence items are stored in the review queue, not synced onward.

---

## 7) What's next (step-by-step)

### A. Domain search provider (plug-in)

* Implement `searchDomain` in `src/search.ts` using Tavily or SerpAPI.
* Normalize the top result to the apex domain (`https://example.org`) and return it.
* Add `TAVILY_API_KEY` (or equivalent) to `.env`.

**Code outline:**

```ts
// src/search.ts
async function searchDomain(query: string): Promise<string | null> {
  // Example (Tavily):
  // const r = await axios.post("https://api.tavily.com/search", { api_key: process.env.TAVILY_API_KEY, query, max_results: 3 });
  // pick best candidate with .org/.de and NGO signals
  // return normalizeUrl(candidateUrl);
  return null;
}
```

**Acceptance checks**

* Prefer `.org`, `.de`, or known NGO TLDs when multiple candidates exist
* Discard social links as main domain
* If confidence is low, return `null` so the record goes to review

---

### B. CSV with headers

* Replace the one-line-per-name reader with a header-aware CSV parser.
* Use `company_name` and optional `seed_domain`.
* Enforce that either seed domain or a successful domain search exists before scraping.

---

### C. Pipedrive sync (new file `src/sync/pipedrive.ts`)

* Prepare upsert for Organization (exact + fuzzy match), then create Deal.
* Use custom fields by key (configurable via `.env`), not by label.
* Add Deal note storing:

  * summary, suggested_hook, website, emails, phones, categories, size, and the `source_urls` for audit
* Write a tiny idempotency layer: don't create a new deal if one exists for the same org and primary category within the last N days.

**ENV placeholders**

```
PIPEDRIVE_API_TOKEN=...
PD_CF_SUMMARY=...
PD_CF_CATEGORY_PRIMARY=...
PD_CF_CATEGORIES_ALL=...
PD_CF_STAFF_RANGE=...
PD_CF_BUDGET_RANGE=...
PD_CF_CONFIDENCE=...
PD_CF_HOOK=...
PD_CF_OUTREACH_TONE=...
PD_PIPELINE_ID=...
PD_STAGE_ID=...
```

---

### D. Asana sync (new file `src/sync/asana.ts`)

* Create a task in `ASANA_PROJECT_ID`.
* Task name: `Outreach: {company_name}`
* Notes should mirror the Pipedrive note, including the Pipedrive deal link once available.
* Optional: tag `AI-Qualified`; if you use custom fields, map category and size.

**ENV placeholders**

```
ASANA_PAT=...
ASANA_PROJECT_ID=...
ASANA_CF_CATEGORY=...
ASANA_CF_STAFF_RANGE=...
ASANA_CF_CONFIDENCE=...
```

---

### E. Quality guards and suppression

* Add a `suppression.jsonl` file/loader to skip domains/emails that opted out.
* Before any sync, check suppression list by domain and email.
* Enhance `source_signals` to include `robots_blocked`, `rendered_js_page`, `legal_form_hint`, `reporting_hint` already present.

---

### F. Reporting

* After each run, aggregate a `reports/latest.csv` with:

  * org name, website, categories, confE, confS, status, created_at
* Optional: a tiny CLI command `npm run report` to convert JSONL logs into the CSV.

---

### G. Deployment (later)

* Containerize and run on a scheduled job runner (Railway/Cloud Run).
* Secrets via provider's secret store.
* SQLite → Postgres for idempotency if multi-instance.

---

## 8) Troubleshooting

* **Playwright fails to launch**
  Run `npx playwright install` or ensure the binary download completed. Some CI environments need `--with-deps`.

* **LLM returns non-JSON**
  The handler already retries once. If still failing, the item goes to review. Check token usage and prompt drift.

* **Too many low-confidence items**
  The auto-pause rule triggers at > 15%. Inspect `src/reviews/*.jsonl` for patterns (e.g., missing domains, junk sites). Improve `searchDomain` heuristics or feed `seed_domain` in CSV temporarily.

* **Rate limit / 429**
  The HTTP queue and retry are configured. If you still hit ceilings, reduce `concurrency` in `utils/http.ts` and/or increase interval pacing.

* **Emails look personal (e.g., gmail)**
  We exclude common freemail domains by default. Adjust in `utils/text.ts` if your use case differs.

---

## 9) Security & data protection notes

* Collect only organization-level contact points from public pages (impressum/kontakt).
* Don't store personal names. If unavoidable in raw HTML, keep raw captures out of logs and don't serialize them.
* Retention window for raw traces is set to 60 days in config; rotate logs accordingly.
* Maintain a suppression list and honor it before sync.

---

## 10) "Tomorrow" checklist (exact actions)

1. **Wire domain search:**

   * Pick provider (Tavily/SerpAPI), add API key to `.env`.
   * Implement `searchDomain` selection and domain normalization.
   * Test with 10 known NGOs; verify main site captured, not social profiles.

2. **Switch CSV reader to header mode**

   * Support `company_name,seed_domain`.
   * If `seed_domain` exists, skip search. Else perform domain search.

3. **Add Pipedrive sync:**

   * Create `src/sync/pipedrive.ts` with Org upsert and Deal create.
   * Configure custom field keys via `.env`.
   * Add note content with audit links.

4. **Add Asana sync:**

   * Create `src/sync/asana.ts`.
   * Include Pipedrive deal link in task notes.
   * Tag tasks as `AI-Qualified`.

5. **Suppression list & guard:**

   * Implement `suppression.jsonl` loader and pre-sync check.

6. **Batch dry-run (20 entries):**

   * Use mixed list: some with seed domains, some requiring search.
   * Ensure low-confidence rate under 15%.
   * Validate 3 sample outputs against live websites manually.

7. **Report export:**

   * Build a simple script to generate `reports/latest.csv` from logs.

If you want, I can produce the exact code files for steps C and D (Pipedrive + Asana) in ready-to-paste form next.

