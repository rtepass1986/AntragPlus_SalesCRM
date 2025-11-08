# Pipedrive Enrichment Guide

## Overview
This tool enriches your existing Pipedrive organizations with missing data using Tavily search and AI.

## What Gets Enriched

The tool automatically fills in missing fields:

### From Tavily Search:
✅ **Website** - Finds official organization website  
✅ **LinkedIn** - Finds LinkedIn company page  

### From Website Scraping:
✅ **Address** - Extracts from Impressum/Kontakt pages  
✅ **Contact Info** - Emails and phone numbers (added to Person records + notes)  

### From AI Analysis:
✅ **Industry** - AI classifies the organization's sector  
✅ **Employee Count** - AI estimates FTE employees  
✅ **Annual Revenue** - AI estimates revenue in EUR  
✅ **Tätigkeitsfeld** - AI classifies activity field (Bildung, Soziales, etc.)  
✅ **Description** - AI generates 2-3 sentence summary in German (added as a note)  

## Setup

1. Make sure your `.env` file has these tokens:
```bash
OPENAI_API_KEY=sk-...
PIPEDRIVE_API_TOKEN=01df8bc1a848e4b3f55d6e2a79f9a62557a66510
TAVILY_API_KEY=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
```

## Usage

### Step 1: Inspect (Already Done!)
```bash
npm run inspect
```
This shows you what fields are empty and creates a report.

### Step 2: Test with Dry Run (RECOMMENDED)
```bash
npm run enrich:dry
```
This simulates enrichment without updating Pipedrive. Review the logs to see what would change.

### Step 3: Run Actual Enrichment
```bash
npm run enrich
```
This will actually update your Pipedrive organizations.

## Configuration

You can control the enrichment with environment variables:

```bash
# Dry run (no updates)
DRY_RUN=true npm run enrich

# Process only first 10 organizations
MAX_ORGS=10 npm run enrich

# Process more organizations
MAX_ORGS=200 npm run enrich
```

## What It Does

For each organization with missing fields:

1. **Website Search**: Uses Tavily to find the official website
   - Prefers .org and .de domains
   - Filters out social media links
   
2. **Website Scraping**: Extracts data from Impressum/Kontakt pages
   - Emails (filters out generic Gmail/Yahoo addresses)
   - Phone numbers (German format)
   - Physical address

3. **LinkedIn Search**: Searches for company LinkedIn page
   - Only accepts linkedin.com/company/ URLs

4. **Research**: Gathers information about the organization
   - Uses website and search results
   - Compiles context for AI analysis

5. **AI Enrichment**: Uses OpenAI to classify and estimate
   - Industry/sector classification
   - Employee count estimation
   - Annual revenue estimation
   - Tätigkeitsfeld (activity field) classification
   - Description/mission summary in German

6. **Update Pipedrive**: 
   - Writes enriched data to organization fields
   - Updates existing Person (contact) with emails and phones
   - Creates note with description and contact info

## Output

### Console Logs
Real-time progress showing:
- Which organization is being processed
- What fields were found/enriched
- Any errors or warnings

### JSON Report
Saved to `src/reports/enrichment-[timestamp].json` with:
- All enriched organizations
- What fields were updated
- Success/error status
- Full update payloads

## Rate Limiting

The tool includes built-in rate limiting:
- 2 seconds between organizations
- Tavily search limits respected
- OpenAI API rate limits handled

## Troubleshooting

**No OpenAI key?**
The tool will still work but skip AI-based enrichment (industry, revenue, employee count). It will only find websites and LinkedIn.

**Rate limits hit?**
Increase the sleep time in the code or reduce MAX_ORGS.

**Tavily errors?**
Check your API key and quota. Free tier has limits.

## Example Run

```bash
$ npm run enrich:dry

[1/50] Processing: Saatkorn Projekt e.V (ID: 6)
  🔍 Searching for website...
  ✅ Found website: https://saatkorn-projekt.de
  🔍 Scraping website for contacts and address...
  ✅ Found address: 70825 Korntal-Münchingen
  ✅ Found 2 emails, 1 phones
  🔍 Searching for LinkedIn...
  ⚠️  LinkedIn not found
  🔍 Researching company...
  ✅ Research complete (2847 chars)
  🤖 Running LLM enrichment...
  ✅ Industry: Bildung
  ✅ Employee count: 5
  ✅ Annual revenue: 50000
  ✅ Tätigkeitsfeld: Kinder und Jugend
  ✅ Generated description (156 chars)
  🔍 [DRY RUN] Would update: website, address, contact_info, industry, employee_count, annual_revenue, taetigkeitsfeld, description
  🔍 [DRY RUN] Would update existing contact with 2 emails, 1 phones
  📝 Would add note to organization

...

ENRICHMENT SUMMARY
================================================================================
Total processed: 50
✅ Fully enriched: 42
⚠️  Partially enriched: 6
❌ Errors: 2
📄 Report saved to: src/reports/enrichment-1730140824217.json
================================================================================
```

## Safety Features

- **Dry run mode** lets you test without changes
- **Only updates empty fields** - never overwrites existing data
- **Detailed logging** of all changes
- **JSON reports** for audit trail
- **Rate limiting** to avoid API throttling

