# ✅ Email Draft System - READY FOR YOUR TEMPLATES

## 🎯 Status: IMPLEMENTED & WAITING FOR YOUR TEMPLATES

The email draft generation system is fully built and ready to use. I've created **example templates** that you can replace with your actual templates.

---

## 📂 What's Been Created

### **1. Template System** 
📄 `src/templates/email-templates.ts`
- 5 example templates (you'll replace these)
- Template structure defined
- Variable placeholder system ready

### **2. Email Generator**
📄 `src/generate-email-drafts.ts`
- Generates personalized emails from enrichment data
- Auto-fills all placeholders
- Calculates confidence scores
- Handles missing data gracefully

### **3. Report-to-Email Script**
📄 `src/create-email-drafts-from-report.ts`
- Reads enrichment reports
- Generates bulk email drafts
- Exports to Markdown, CSV, or JSON

### **4. NPM Scripts (Ready to Use)**
```bash
npm run emails:generate    # Auto-detect latest report, export markdown
npm run emails:markdown    # Export as markdown
npm run emails:csv        # Export as CSV for mail merge
npm run emails:json       # Export as JSON
```

---

## 📋 NEXT STEP: Provide Your Templates

### **What I Need From You:**

1. **Your email templates** (the actual text you use)
2. **When to use each template** (e.g., "Use for initial contact", "Use for follow-up")
3. **Any specific placeholders** you want (beyond the ones available)

### **Available Placeholders:**

You can use these in your templates:

```
{{orgName}}                          - Organization name
{{primaryDecisionMaker.name}}        - Full name
{{primaryDecisionMaker.firstName}}   - First name only
{{primaryDecisionMaker.lastName}}    - Last name only
{{primaryDecisionMaker.salutation}}  - Herr/Frau (auto-detected)
{{primaryDecisionMaker.role}}        - Role/title
{{primaryDecisionMaker.email}}       - Email address
{{description}}                      - AI-generated description
{{arbeitsbereiche}}                  - All work areas (comma-separated)
{{arbeitsbereiche[0]}}              - First work area
{{flagshipProjects[0]}}             - First flagship project
{{taetigkeitsfeld}}                 - Activity field
{{legalForm}}                       - e.V., gGmbH, etc.
{{estimatedStaff}}                  - Estimated employee count
{{website}}                         - Website URL
{{calculatedCost}}                  - Estimated admin costs (auto-calculated)
```

---

## 📝 Template Format

Send your templates in this format:

```
TEMPLATE NAME: [Name of template]
USE WHEN: [When to use this template]
SUBJECT: [Email subject line with {{placeholders}}]
BODY:
[Email body with {{placeholders}}]

---

TEMPLATE NAME: [Next template]
...
```

### **Example:**

```
TEMPLATE NAME: Initial Software Contact
USE WHEN: Organization has IT decision maker identified
SUBJECT: Digitalisierung für {{orgName}} - 15 Stunden pro Woche sparen

BODY:
Sehr geehrte/r {{primaryDecisionMaker.salutation}} {{primaryDecisionMaker.lastName}},

als {{primaryDecisionMaker.role}} bei {{orgName}} kennen Sie sicher die 
Herausforderung: Förderanträge manuell zu bearbeiten kostet wertvolle Zeit.

{{description}}

Mit AntragPlus automatisieren Sie Ihr Antragsmanagement und sparen 
durchschnittlich 15 Stunden pro Woche.

Hätten Sie Interesse an einem kurzen Austausch?

Mit freundlichen Grüßen,
[Ihr Name]
```

---

## 🚀 How to Add Your Templates

Once you provide them, I will:

1. **Replace** example templates in `src/templates/email-templates.ts`
2. **Add logic** for when to use each template
3. **Test** with your enrichment data
4. **Generate** actual email drafts

---

## 🧪 Current Example Templates

I've created 5 example templates as placeholders:

1. **software-focus** - For orgs with IT decision makers
2. **followup** - Second touch after no response
3. **project-focus** - References specific projects
4. **strategic** - CEO/Vorstand focus (ROI-based)
5. **quick-value** - Short, punchy email

**You can keep these, modify them, or replace them entirely.**

---

## ✅ Test It Now (With Example Templates)

Even with example templates, you can test the system:

```bash
# 1. Run enrichment (if not done)
FILTER_STAGE="Qualified Lead generiert" MAX_ORGS=10 npm run enrich:leadership

# 2. Generate email drafts from latest report
npm run emails:markdown

# 3. Check the output
cat src/email-drafts/email-drafts-*.md
```

This will show you:
- How placeholders get filled
- What the final emails look like
- Confidence scores for each email
- Any warnings about missing data

---

## 📊 What You'll Get

After providing your templates, you'll be able to:

### **Generate Bulk Emails:**
```bash
npm run emails:markdown    # Get markdown file with all emails
npm run emails:csv        # Get CSV for mail merge
```

### **Example Output (Markdown):**
```markdown
## imBlick Kinder-und Jugendhilfe gGmbH

**To:** Steffi Jöst (Geschäftsführung)
**Email:** joest@imblick-online.de
**Template:** Initial Software Contact
**Confidence:** HIGH

**Subject:** Digitalisierung für imBlick - 15 Stunden pro Woche sparen

**Body:**
Sehr geehrte Frau Jöst,

als Geschäftsführung bei imBlick Kinder-und Jugendhilfe gGmbH mit ca. 50 
Mitarbeitern kennen Sie sicher die Herausforderung...

[Full personalized email]
```

### **Example Output (CSV):**
Import directly into your email client for mail merge!

---

## 💡 What Makes This Powerful

- ✅ **100% personalized** - Every email uses real data
- ✅ **Smart fallbacks** - Handles missing data gracefully
- ✅ **Confidence scores** - Know which emails are high-quality
- ✅ **Multiple formats** - Markdown, CSV, JSON
- ✅ **Auto-salutation** - Detects Herr/Frau automatically
- ✅ **Context-aware** - Mentions specific projects, work areas

---

## 🎯 Ready When You Are!

**Just send me your email templates and I'll integrate them immediately.**

Format:
```
TEMPLATE NAME: [Name]
USE WHEN: [Criteria]
SUBJECT: [Subject with {{placeholders}}]
BODY: [Body with {{placeholders}}]
```

**Questions I'll need answered:**
1. How many templates do you have? (2-3? More?)
2. When should each template be used?
3. Any specific fields you want that aren't in the placeholder list?

---

## 📁 Files to Review (Optional)

If you want to see the code:
- `src/templates/email-templates.ts` - Template definitions (REPLACE WITH YOURS)
- `src/generate-email-drafts.ts` - Email generator (WORKING)
- `src/create-email-drafts-from-report.ts` - Bulk script (WORKING)

---

**Everything is saved and ready! Send your templates whenever you're ready.** 🚀

