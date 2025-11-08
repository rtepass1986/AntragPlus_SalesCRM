# ⚡ Quick Start Guide

## 🎯 Get Up and Running in 5 Minutes

### Step 1: Run Setup (2 minutes)

```bash
cd /Users/roberttepass/Desktop/Agenti_Build/AntragPlus_SalesMaschnie/AntragPlus_Sales_Software

chmod +x setup.sh
./setup.sh
```

### Step 2: Verify Setup (1 minute)

```bash
# Check build
npm run build

# Should see: "✅ Build successful"
```

### Step 3: Test Lead Enrichment (1 minute)

```bash
# Dry run (no actual updates)
npm run lead:enrich:dry
```

### Step 4: Test Sync (1 minute)

```bash
# Local sync test
npm run sync:test
```

---

## 🎉 Done!

Your unified sales software is ready!

### What You Can Do Now:

**Lead Operations:**
```bash
npm run lead:enrich          # Enrich leads from Pipedrive
npm run lead:leadership      # Extract leadership data
npm run lead:emails          # Generate email drafts
npm run lead:analyze         # Analyze stage gaps
```

**Sync Operations:**
```bash
npm run sync:backfill        # Initial Pipedrive → Asana sync
npm run sync:cleanup         # Clean up Asana tasks
```

**Deployment:**
```bash
npm run deploy               # Deploy to AWS Lambda
```

---

## 📚 Learn More

- `README.md` - Full documentation
- `SETUP_INSTRUCTIONS.md` - Detailed setup
- `MIGRATION_COMPLETE.md` - Migration details

---

## 🆘 Having Issues?

### Build fails?
```bash
npm install
npm run build
```

### Missing .env?
```bash
cp env.example .env
# Then edit .env with your credentials
```

### Database error?
```bash
# Check PostgreSQL is running
brew services list | grep postgresql

# Start if needed
brew services start postgresql
```

---

**Need help?** Check `SETUP_INSTRUCTIONS.md` for troubleshooting!

