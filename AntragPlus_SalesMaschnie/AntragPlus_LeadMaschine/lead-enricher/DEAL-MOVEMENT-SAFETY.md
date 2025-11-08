# 🛡️ Deal Movement Safety - PROTECTED BY DEFAULT

## ✅ SAFE MODE ENABLED

**By default, deals will NOT be moved in Pipedrive.**

This is a safety measure to prevent accidental deal movement without your explicit consent.

---

## 🔒 Default Behavior (SAFE)

When you run:
```bash
npm run enrich:leadership
```

**What happens:**
- ✅ Organizations get enriched
- ✅ Person records created for leadership
- ✅ Notes added to organizations and deals
- ✅ **Deals STAY in their current stage** ← SAFE!

You'll see this in the logs:
```
⏸️  Deal movement: DISABLED (deals will stay in current stage) ✅ SAFE MODE
```

---

## ⚠️ How to Enable Deal Movement (When You Want It)

If you **explicitly want** deals to move after enrichment, use:

```bash
SKIP_MOVE=false npm run enrich:leadership
```

You'll see this warning:
```
⚠️  Deal movement: ENABLED (deals will move to "Lead enriched/geprüft")
```

---

## 📋 All Scenarios

### **Scenario 1: Normal Enrichment (Default - SAFE)**
```bash
npm run enrich:leadership
```
**Result:**
- Enriches data ✅
- Creates contacts ✅
- Adds notes ✅
- **Deals stay in place** ✅ SAFE

---

### **Scenario 2: Dry Run (Testing)**
```bash
DRY_RUN=true npm run enrich:leadership
```
**Result:**
- Shows what would be enriched
- Shows what would be created
- **NO changes made to Pipedrive** ✅ ULTRA SAFE

---

### **Scenario 3: Enrichment WITH Deal Movement (Explicit)**
```bash
SKIP_MOVE=false npm run enrich:leadership
```
**Result:**
- Enriches data ✅
- Creates contacts ✅
- Adds notes ✅
- **Moves deals to "Lead enriched/geprüft"** ⚠️

---

### **Scenario 4: Re-enrichment (Update Existing)**
```bash
FILTER_STAGE="Lead enriched/geprüft" npm run enrich:leadership
```
**Result:**
- Updates existing enrichment
- Fills gaps (Tätigkeitsfeld, etc.)
- **Deals stay in "Lead enriched/geprüft"** ✅ SAFE

---

## 🎯 Recommended Workflow

### **Step 1: Always Test First (Dry Run)**
```bash
FILTER_STAGE="Your Stage" MAX_ORGS=5 DRY_RUN=true npm run enrich:leadership
```
- Review what would be changed
- Check enrichment quality
- No risk!

### **Step 2: Small Batch (Safe Mode)**
```bash
FILTER_STAGE="Your Stage" MAX_ORGS=10 npm run enrich:leadership
```
- Enriches 10 organizations
- Deals stay in place
- Review in Pipedrive

### **Step 3: Verify Quality**
- Check notes in Pipedrive
- Verify Person records created
- Confirm data quality

### **Step 4: Scale Up (Still Safe)**
```bash
FILTER_STAGE="Your Stage" MAX_ORGS=100 npm run enrich:leadership
```
- Deals still don't move!
- Safe to scale

### **Step 5: (Optional) Enable Movement**
Only if you want deals to move:
```bash
SKIP_MOVE=false FILTER_STAGE="Your Stage" npm run enrich:leadership
```

---

## 🔍 How to Check Current Setting

Look for this line in the console when you run enrichment:

### **Safe Mode (Default):**
```
⏸️  Deal movement: DISABLED (deals will stay in current stage) ✅ SAFE MODE
```

### **Movement Enabled:**
```
⚠️  Deal movement: ENABLED (deals will move to "Lead enriched/geprüft")
```

---

## 📊 Environment Variables Summary

| Variable | Default | What It Does |
|----------|---------|--------------|
| `SKIP_MOVE` | `true` | Keep deals in current stage (SAFE) |
| `SKIP_MOVE=false` | - | Move deals to target stage (EXPLICIT) |
| `DRY_RUN=true` | `false` | No changes at all (TESTING) |
| `FILTER_STAGE` | "Qualified Lead generiert" | Which stage to enrich |
| `TARGET_STAGE` | "Lead enriched/geprüft" | Where to move (if enabled) |
| `MAX_ORGS` | `50` | How many to process |

---

## ✅ Why This Matters

### **Before (Unsafe Default):**
```bash
npm run enrich:leadership
→ Deals automatically moved ❌
→ No way to just update data ❌
→ Risk of accidental moves ❌
```

### **After (Safe Default):**
```bash
npm run enrich:leadership
→ Deals stay in place ✅
→ Only enriches data ✅
→ Explicit consent required to move ✅
```

---

## 🎓 Examples

### **Example 1: Backfill Tätigkeitsfeld (Don't Move)**
```bash
FILTER_STAGE="Lead enriched/geprüft" MAX_ORGS=100 npm run enrich:leadership
```
**Result:** Updates Tätigkeitsfeld, deals stay in "Lead enriched/geprüft" ✅

### **Example 2: New Leads (Don't Move Yet)**
```bash
FILTER_STAGE="Qualified Lead generiert" MAX_ORGS=50 npm run enrich:leadership
```
**Result:** Enriches new leads, they stay in "Qualified Lead generiert" ✅

### **Example 3: Process and Move (Explicit)**
```bash
SKIP_MOVE=false FILTER_STAGE="Qualified Lead generiert" MAX_ORGS=50 npm run enrich:leadership
```
**Result:** Enriches AND moves to "Lead enriched/geprüft" ⚠️

---

## 🚨 Important Notes

1. **Default is SAFE** - Deals never move unless you explicitly enable it
2. **DRY_RUN is SAFEST** - Nothing changes at all, use for testing
3. **Always test first** - Use `MAX_ORGS=5 DRY_RUN=true` before production runs
4. **Console shows status** - Look for "SAFE MODE" or "ENABLED" messages
5. **No accidental moves** - You must type `SKIP_MOVE=false` to enable movement

---

## 📝 Quick Reference

### **I want to...**

**Enrich without moving:**
```bash
npm run enrich:leadership
```

**Test without changes:**
```bash
DRY_RUN=true npm run enrich:leadership
```

**Enrich AND move:**
```bash
SKIP_MOVE=false npm run enrich:leadership
```

**Update existing stage:**
```bash
FILTER_STAGE="Lead enriched/geprüft" npm run enrich:leadership
```

**Small test batch:**
```bash
MAX_ORGS=5 DRY_RUN=true npm run enrich:leadership
```

---

## ✅ Summary

- **Default = SAFE** (deals don't move)
- **Explicit consent required** to enable movement
- **Clear warnings** when movement is enabled
- **Always visible** in console logs
- **No surprises** - you control everything

**Your deals are protected!** 🛡️

