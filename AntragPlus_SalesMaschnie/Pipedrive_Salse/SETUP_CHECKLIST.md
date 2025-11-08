# Setup Checklist

## ✅ Completed
- [x] Project structure created
- [x] Dependencies installed (`undici`, `ulid`, `serverless-esbuild`, etc.)
- [x] TypeScript configured
- [x] Serverless Framework configured with esbuild
- [x] Asana client with OAuth support (Client ID & Secret configured)
- [x] Pipedrive client
- [x] Database schema and operations
- [x] Webhook handlers (Pipedrive & Asana)
- [x] Sync and backfill functions
- [x] Code successfully compiles

## 🔲 TODO - What You Need to Do

### 1. Get API Credentials

#### Pipedrive API Token
1. Log into Pipedrive
2. Go to Settings → Personal Preferences → API
3. Copy your API token
4. Add to `.env` file as `PIPEDRIVE_API_TOKEN`

#### Asana Access Token
**Option A: Personal Access Token (Quick Start)**
1. Go to https://app.asana.com/0/my-apps
2. Click "Create new token"
3. Give it a name (e.g., "Pipedrive Sync")
4. Copy the token
5. Add to `.env` file as `ASANA_ACCESS_TOKEN`

**Option B: OAuth Flow (Production)**
- You already have:
  - Client ID: `1211767256476624`
  - Client Secret: `cd476c0d2493fa6a4a78980b98648cfe`
- Implement OAuth flow to get user access tokens

#### Asana Workspace ID
```bash
# Using curl with your access token
curl https://app.asana.com/api/1.0/workspaces \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Copy the "gid" from the response
```

### 2. Set Up Database

**Option A: Local PostgreSQL**
```bash
# Install PostgreSQL (macOS)
brew install postgresql
brew services start postgresql

# Create database
createdb pipedrive_sync

# Your DATABASE_URL will be:
# postgresql://YOUR_USERNAME@localhost:5432/pipedrive_sync
```

**Option B: Cloud Database (Recommended)**
- **Supabase** (Free tier available)
  1. Go to https://supabase.com
  2. Create new project
  3. Get connection string from Settings → Database
  4. Use as `DATABASE_URL`

- **AWS RDS**
  1. Create PostgreSQL instance in AWS Console
  2. Get connection string
  3. Use as `DATABASE_URL`

### 3. Create `.env` File

Copy `env.example` to `.env` and fill in your values:

```bash
cp env.example .env
# Then edit .env with your actual credentials
```

### 4. Test Locally

```bash
# Test that everything compiles
npm run build

# Test database connection (optional - create a test script)
# The database schema will auto-create on first function run
```

### 5. Deploy to AWS

```bash
# Make sure you have AWS credentials configured
aws configure

# Deploy to dev environment
npm run deploy

# You'll get webhook URLs in the output - save these!
```

### 6. Configure Webhooks

#### Pipedrive Webhooks
1. Go to Pipedrive Settings → Webhooks
2. Click "Create new webhook"
3. Enter your webhook URL: `https://YOUR-API-URL/dev/webhook/pipedrive`
4. Subscribe to events:
   - `deal.added`
   - `deal.updated`
   - `deal.deleted`
5. Save

#### Asana Webhooks
Asana webhooks must be created via API:

```bash
# Example using curl
curl -X POST https://app.asana.com/api/1.0/webhooks \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "resource": "YOUR_PROJECT_GID",
    "target": "https://YOUR-API-URL/dev/webhook/asana"
  }'
```

### 7. Run Initial Backfill

Once everything is configured, run the backfill to sync existing data:

```bash
serverless invoke -f backfill
```

This will:
- Fetch all deals from Pipedrive
- Create corresponding tasks in Asana
- Set up sync mappings in the database

### 8. Monitor

```bash
# View logs
serverless logs -f sync -t
serverless logs -f pipedriveWebhook -t
serverless logs -f asanaWebhook -t

# Check database
psql $DATABASE_URL -c "SELECT * FROM sync_mappings LIMIT 10;"
psql $DATABASE_URL -c "SELECT * FROM sync_logs ORDER BY created_at DESC LIMIT 10;"
```

## 📋 Environment Variables Summary

You need to set these in your `.env` file:

| Variable | Where to Get It | Required |
|----------|----------------|----------|
| `PIPEDRIVE_API_TOKEN` | Pipedrive Settings → API | ✅ Yes |
| `ASANA_CLIENT_ID` | Already set: `1211767256476624` | ✅ Yes |
| `ASANA_CLIENT_SECRET` | Already set: `cd476c0d2493fa6a4a78980b98648cfe` | ✅ Yes |
| `ASANA_ACCESS_TOKEN` | Asana Personal Access Token or OAuth | ✅ Yes |
| `ASANA_WORKSPACE_ID` | Asana API workspaces endpoint | ✅ Yes |
| `DATABASE_URL` | PostgreSQL connection string | ✅ Yes |
| `WEBHOOK_SECRET` | Generate random string | ✅ Yes |
| `STAGE` | `dev` or `prod` | Optional |
| `NODE_ENV` | `development` or `production` | Optional |

## 🔧 Troubleshooting

### Database Connection Issues
```bash
# Test PostgreSQL connection
psql $DATABASE_URL -c "SELECT version();"
```

### API Authentication Issues
```bash
# Test Pipedrive API
curl "https://api.pipedrive.com/v1/users?api_token=YOUR_TOKEN"

# Test Asana API
curl "https://app.asana.com/api/1.0/users/me" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Build Issues
```bash
# Clean and rebuild
rm -rf dist/ node_modules/
npm install
npm run build
```

## 📚 Next Steps After Setup

1. **Customize Field Mappings**: Edit `src/mapping.ts` to match your specific Pipedrive fields to Asana
2. **Add Custom Logic**: Extend webhook handlers for your specific business logic
3. **Set Up Monitoring**: Configure CloudWatch alarms for errors
4. **Add Tests**: Write unit tests for critical functions
5. **Documentation**: Document your custom field mappings and business rules

## 🚀 Quick Start Commands

```bash
# 1. Install dependencies (already done)
npm install

# 2. Create .env file
cp env.example .env
# Edit .env with your credentials

# 3. Build
npm run build

# 4. Deploy
npm run deploy

# 5. Run backfill
serverless invoke -f backfill

# 6. Monitor
serverless logs -f sync -t
```

## 📞 Support

If you encounter issues:
1. Check the logs: `serverless logs -f FUNCTION_NAME`
2. Verify environment variables are set correctly
3. Test API credentials independently
4. Check database connectivity
5. Review the README.md for detailed documentation

