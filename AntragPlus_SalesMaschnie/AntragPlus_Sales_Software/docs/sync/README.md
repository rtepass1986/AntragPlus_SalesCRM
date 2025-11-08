# Pipedrive-Asana Sales Sync

Serverless bidirectional sync between Pipedrive CRM and Asana project management.

## Features

- 🔄 **Bidirectional Sync**: Pipedrive deals ↔ Asana tasks
- ⚡ **Real-time Webhooks**: Instant updates from both platforms
- 📅 **Scheduled Sync**: Regular polling to catch missed updates
- 🔙 **Backfill**: Initial data migration from Pipedrive to Asana
- 📊 **Database Tracking**: PostgreSQL sync mapping and logging
- 🔐 **OAuth Support**: Asana OAuth authentication

## Tech Stack

- **Runtime**: AWS Lambda (Node.js 18)
- **Framework**: Serverless Framework
- **Language**: TypeScript
- **HTTP Client**: Undici
- **Database**: PostgreSQL
- **Bundler**: esbuild

## Prerequisites

1. **Pipedrive Account** - Get API token from Settings → Personal Preferences → API
2. **Asana Account** - OAuth credentials provided
3. **PostgreSQL Database** - Local or cloud (Supabase, RDS, etc.)
4. **AWS Account** - For Lambda deployment

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the project root:

```bash
# Pipedrive Configuration
PIPEDRIVE_API_TOKEN=your_pipedrive_api_token

# Asana Configuration
ASANA_CLIENT_ID=1211767256476624
ASANA_CLIENT_SECRET=cd476c0d2493fa6a4a78980b98648cfe
ASANA_ACCESS_TOKEN=your_asana_access_token
ASANA_WORKSPACE_ID=your_asana_workspace_id

# Database Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/pipedrive_sync

# Webhook Security
WEBHOOK_SECRET=generate_a_random_secret

# Environment
STAGE=dev
NODE_ENV=development
```

### 3. Get Asana Access Token

You have two options:

**Option A: Personal Access Token (Quick Start)**
1. Go to https://app.asana.com/0/my-apps
2. Create a Personal Access Token
3. Use it as `ASANA_ACCESS_TOKEN`

**Option B: OAuth Flow (Production)**
1. Use the provided `ASANA_CLIENT_ID` and `ASANA_CLIENT_SECRET`
2. Implement OAuth flow in your application
3. Exchange code for access token

### 4. Get Asana Workspace ID

```bash
# Using curl with your access token
curl https://app.asana.com/api/1.0/workspaces \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 5. Set Up Database

The database schema will auto-create on first run, but you need to have PostgreSQL running:

**Local PostgreSQL:**
```bash
# macOS
brew install postgresql
brew services start postgresql
createdb pipedrive_sync
```

**Or use a cloud provider:**
- Supabase (free tier)
- AWS RDS
- Heroku Postgres

## Usage

### Local Development

```bash
# Run locally
npm run dev

# Build TypeScript
npm run build
```

### Deploy to AWS

```bash
# Deploy to dev
npm run deploy

# Deploy to production
npm run deploy:prod
```

### Manual Functions

**Backfill existing data:**
```bash
serverless invoke -f backfill
```

**Test sync:**
```bash
serverless invoke -f sync
```

## API Endpoints

Once deployed, you'll get webhook URLs:

- `POST /webhook/pipedrive` - Pipedrive webhook endpoint
- `POST /webhook/asana` - Asana webhook endpoint

### Configure Webhooks

**Pipedrive:**
1. Go to Settings → Webhooks
2. Add webhook URL: `https://your-api.amazonaws.com/dev/webhook/pipedrive`
3. Subscribe to: `deal.added`, `deal.updated`, `deal.deleted`

**Asana:**
1. Use Asana API to create webhook
2. Target URL: `https://your-api.amazonaws.com/dev/webhook/asana`

## Project Structure

```
/
├── src/
│   ├── sync.ts           # Main sync handler (scheduled)
│   ├── backfill.ts       # Initial data migration
│   ├── pdWebhook.ts      # Pipedrive webhook handler
│   ├── asanaWebhook.ts   # Asana webhook handler
│   ├── asana.ts          # Asana API client
│   ├── pipedrive.ts      # Pipedrive API client
│   ├── db.ts             # Database operations
│   ├── mapping.ts        # Data mapping logic
│   ├── env.ts            # Environment configuration
│   └── util.ts           # Utility functions
├── serverless.yml        # Serverless configuration
├── tsconfig.json         # TypeScript configuration
└── package.json          # Dependencies
```

## Data Mapping

### Pipedrive → Asana

| Pipedrive Field | Asana Field |
|----------------|-------------|
| Deal Title | Task Name |
| Deal Value | Custom Field |
| Deal Status | Task Completed |
| Close Date | Task Due Date |
| Stage | Project |

### Stage Mapping

| Pipedrive Stage | Asana Project |
|----------------|---------------|
| Lead | Sales Pipeline - Leads |
| Qualified | Sales Pipeline - Qualified |
| Proposal | Sales Pipeline - Proposals |
| Negotiation | Sales Pipeline - Negotiation |
| Closed Won | Sales Pipeline - Closed Won |
| Closed Lost | Sales Pipeline - Closed Lost |

## Database Schema

### `sync_mappings` Table
- `pipedrive_deal_id` - Pipedrive deal ID
- `asana_task_id` - Asana task GID
- `sync_direction` - bidirectional, pipedrive_to_asana, asana_to_pipedrive
- `last_sync_time` - Last successful sync timestamp

### `sync_logs` Table
- Action logs for debugging and monitoring
- Stores success/error states
- Includes full sync data for troubleshooting

## Troubleshooting

### Check Logs

```bash
# View logs
serverless logs -f sync
serverless logs -f pipedriveWebhook
```

### Common Issues

1. **Database Connection Failed**
   - Check `DATABASE_URL` format
   - Ensure database is accessible from Lambda (VPC config if needed)

2. **API Rate Limits**
   - Adjust chunk sizes in sync functions
   - Increase delays between requests

3. **Webhook Not Receiving Events**
   - Verify webhook URLs are correct
   - Check webhook signatures
   - Review CloudWatch logs

## License

MIT

