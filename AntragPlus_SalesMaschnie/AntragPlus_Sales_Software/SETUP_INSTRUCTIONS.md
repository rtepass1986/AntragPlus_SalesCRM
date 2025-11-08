# 🔧 Setup Instructions

## Step 1: Copy Source Files

Run these commands to copy all source files from the original projects:

```bash
cd /Users/roberttepass/Desktop/Agenti_Build/AntragPlus_SalesMaschnie/AntragPlus_Sales_Software

# Create directory structure
mkdir -p src/lead/{prompts,templates,utils,sync,data,logs,reports}
mkdir -p src/sync
mkdir -p src/automation
mkdir -p src/shared/{db,api,utils}
mkdir -p data/{leads,reports,logs}
mkdir -p docs/{lead-enricher,sync}

# Copy Lead Enricher source files
cp -r ../AntragPlus_LeadMaschine/lead-enricher/src/*.ts src/lead/
cp -r ../AntragPlus_LeadMaschine/lead-enricher/src/prompts/* src/lead/prompts/
cp -r ../AntragPlus_LeadMaschine/lead-enricher/src/templates/* src/lead/templates/
cp -r ../AntragPlus_LeadMaschine/lead-enricher/src/utils/* src/lead/utils/
cp -r ../AntragPlus_LeadMaschine/lead-enricher/src/sync/* src/lead/sync/
cp ../AntragPlus_LeadMaschine/lead-enricher/config.ts src/shared/config-lead.ts

# Copy Lead Enricher data files
cp ../AntragPlus_LeadMaschine/lead-enricher/src/data/leads.csv data/leads/

# Copy Lead Enricher documentation
cp ../AntragPlus_LeadMaschine/lead-enricher/*.md docs/lead-enricher/

# Copy Pipedrive Sales source files
cp ../Pipedrive_Salse/src/*.ts src/sync/

# Copy Pipedrive Sales documentation
cp ../Pipedrive_Salse/*.md docs/sync/

# Copy Pipedrive Sales helper scripts
cp ../Pipedrive_Salse/*.js ./

echo "✅ All files copied successfully!"
```

## Step 2: Install Dependencies

```bash
npm install
```

## Step 3: Create .env File

```bash
cp ../Pipedrive_Salse/.env .env
```

Or create manually:

```env
# Pipedrive
PIPEDRIVE_API_TOKEN=01df8bc1a848e4b3f55d6e2a79f9a62557a66510

# Asana
ASANA_CLIENT_ID=1211767256476624
ASANA_CLIENT_SECRET=cd476c0d2493fa6a4a78980b98648cfe
ASANA_ACCESS_TOKEN=2/119578449411707/1211767717009213:0bebfc748959ea831799a526ff15a9eb
ASANA_WORKSPACE_ID=308803216953534

# Database
DATABASE_URL=postgresql://roberttepass@localhost:5432/pipedrive_sync

# OpenAI
OPENAI_API_KEY=your_key_here

# Tavily (optional)
TAVILY_API_KEY=your_key_here

# Security
WEBHOOK_SECRET=your_webhook_secret_here
```

## Step 4: Update Import Paths

Some files will need import path updates. Run this script:

```bash
# Update imports in lead files
find src/lead -name "*.ts" -type f -exec sed -i '' 's|from '\''\.\/|from '\''@lead/|g' {} \;
find src/lead -name "*.ts" -type f -exec sed -i '' 's|from '\''\.\.\/|from '\''@lead/|g' {} \;

# Update imports in sync files  
find src/sync -name "*.ts" -type f -exec sed -i '' 's|from '\''\.\/|from '\''@sync/|g' {} \;

echo "✅ Import paths updated!"
```

## Step 5: Build & Test

```bash
# Build TypeScript
npm run build

# Test lead enrichment (dry run)
npm run lead:enrich:dry

# Test sync
npm run sync:test

echo "✅ Build successful!"
```

## Step 6: Deploy (Optional)

```bash
# Deploy to AWS Lambda
npm run deploy

# Or deploy to production
npm run deploy:prod
```

---

## 🔍 Verification Checklist

After setup, verify:

- [ ] All TypeScript files compile without errors
- [ ] `.env` file exists with all required variables
- [ ] Database connection works
- [ ] Lead enrichment runs (dry mode)
- [ ] Sync functions work locally
- [ ] All documentation copied

---

## 🚨 Common Issues

### Issue: TypeScript compilation errors

**Solution:** Check import paths, ensure all dependencies installed

```bash
npm install
npm run build
```

### Issue: Database connection failed

**Solution:** Verify PostgreSQL is running and DATABASE_URL is correct

```bash
# Check if PostgreSQL is running
brew services list | grep postgresql

# Test connection
psql pipedrive_sync -c "SELECT 1;"
```

### Issue: Missing environment variables

**Solution:** Ensure `.env` file exists and has all required variables

```bash
cat .env
```

---

## 📝 Next Steps

Once setup is complete:

1. Review `README.md` for usage instructions
2. Check `docs/` for detailed documentation
3. Run initial lead enrichment: `npm run lead:enrich:dry`
4. Run backfill: `npm run sync:backfill`
5. Deploy to AWS: `npm run deploy`

