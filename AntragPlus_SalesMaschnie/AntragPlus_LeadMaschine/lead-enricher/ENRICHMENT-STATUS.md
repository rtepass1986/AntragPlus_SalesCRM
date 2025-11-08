# Lead Enrichment Configuration Summary

## ✅ Implementation Complete

### **What's Been Configured:**

1. **Stage-Based Processing**
   - Source Stage: `Qualified Lead generiert` (1,410 deals found)
   - Target Stage: `Lead enriched/geprüft` (deals moved here after enrichment)
   - Default: Process first 100 organizations

2. **Enrichment Fields**
   - ✅ Website
   - ✅ LinkedIn
   - ✅ Industry (with Pipedrive field mapping)
   - ✅ Tätigkeitsfeld (with Pipedrive field mapping)
   - ✅ Address (scraped from website)
   - ✅ Emails (saved to Contact + Organization notes + Deal notes)
   - ✅ **Phones (German format - saved to Contact + notes)**
   - ✅ AI-generated description (saved to notes)

3. **Phone Number Formatting**
   - Converts `+49 371 2800687` → `0371 2800687`
   - Removes all +49 prefixes
   - Formats with space: `0371 2800687`
   - Filters invalid numbers
   - Removes duplicates

4. **Where Data Gets Saved:**
   - **Organization fields**: website, LinkedIn, industry, Tätigkeitsfeld, address
   - **Contact (Person) fields**: emails, phones
   - **Organization notes**: AI description + contact info
   - **Deal notes**: AI description + contact info

5. **Automated Deal Movement**
   - After successful enrichment, deals automatically move to "Lead enriched/geprüft" stage

6. **Error Handling**
   - Process **stops immediately** if Tavily API quota is exceeded
   - Clear error message shows why (quota/rate limit/auth)
   - No partial processing when API fails

---

## 🚨 Current Issue: Tavily API Quota

**Status Code**: 432
**Message**: "This request exceeds your plan's set usage limit"

### **Solutions:**

1. **Upgrade Tavily Plan** (Recommended)
   - Visit: https://tavily.com/pricing
   - Current plan: Free tier (limited searches per month)
   - Recommended: Pro plan for production enrichment

2. **Wait for Quota Reset**
   - Free tier quotas typically reset monthly
   - Check your Tavily dashboard for reset date

3. **Use Alternative API Key**
   - If you have multiple Tavily accounts
   - Update `.env` with: `TAVILY_API_KEY=your-new-key`

---

## 🚀 How to Run (Once Tavily is Fixed)

### **1. Test with 2 organizations:**
```bash
FILTER_STAGE="Qualified Lead generiert" MAX_ORGS=2 npm run enrich
```

### **2. Process first 100 organizations:**
```bash
FILTER_STAGE="Qualified Lead generiert" npm run enrich
```

### **3. Process all 1,200 organizations:**
```bash
FILTER_STAGE="Qualified Lead generiert" MAX_ORGS=1200 npm run enrich
```

### **4. Dry run (no changes):**
```bash
FILTER_STAGE="Qualified Lead generiert" DRY_RUN=true npm run enrich
```

---

## 📊 What Will Happen:

1. **Fetches** all deals from "Qualified Lead generiert" stage (1,410 deals, 1,200 unique orgs)
2. **Enriches** organizations with:
   - Website & LinkedIn discovery (Tavily)
   - Contact info scraping (emails, phones)
   - AI classification (industry, Tätigkeitsfeld)
   - AI description generation
3. **Updates** Pipedrive:
   - Organization fields
   - Contact records (phones in German format!)
   - Notes on organization and deal
4. **Moves** deal to "Lead enriched/geprüft" stage
5. **Stops** immediately if API quota is reached

---

## 📝 Verification After Run:

Check a few enriched deals in Pipedrive:
- [ ] Organization has website & LinkedIn
- [ ] Organization has industry & Tätigkeitsfeld
- [ ] Contact has **German-formatted phone numbers** (e.g., `0371 2800687`)
- [ ] Organization notes have AI description
- [ ] Deal notes have contact info
- [ ] **Deal is in "Lead enriched/geprüft" stage**

---

## 🔧 Environment Variables:

```bash
# Current Configuration
FILTER_STAGE="Qualified Lead generiert"   # Source stage
TARGET_STAGE="Lead enriched/geprüft"       # Destination stage
MAX_ORGS=100                                # Default: 100 organizations
DRY_RUN=false                               # Set to 'true' to test without changes
```

---

## ⏱️ Estimated Time:

- **100 organizations**: ~25-30 minutes
- **1,200 organizations**: ~5-6 hours

---

## 🎯 Next Steps:

1. ✅ All code is ready
2. ⚠️ **Resolve Tavily API quota** (upgrade or wait for reset)
3. ✅ Test with 2 organizations
4. ✅ Run full enrichment for 100 organizations
5. ✅ Verify results in Pipedrive
6. ✅ Run for all 1,200 organizations

---

**Last Updated**: October 28, 2025
**Status**: ✅ Ready to run (pending Tavily API quota)

