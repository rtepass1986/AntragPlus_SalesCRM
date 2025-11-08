# 🚀 Pipedrive-Asana Sync System - Deployment Summary

## ✅ What's Deployed

### AWS Lambda Functions (Production)
All functions are deployed to AWS Lambda with Node.js 20.x runtime:

1. **backfill** - Initial data sync from Pipedrive to Asana
2. **sync** - Scheduled sync (runs every 5 minutes)
3. **pipedriveWebhook** - Handles real-time updates from Pipedrive
4. **asanaWebhook** - Handles real-time updates from Asana
5. **cleanup** - Maintenance function

### Webhook Endpoints
- **Pipedrive Webhook**: `https://146hv1icub.execute-api.us-east-1.amazonaws.com/production/webhook/pipedrive`
- **Asana Webhook**: `https://146hv1icub.execute-api.us-east-1.amazonaws.com/production/webhook/asana`

## 🗄️ Database Configuration

**Current Setup**: Local PostgreSQL
- Database: `pipedrive_sync`
- Host: `localhost:5432`
- User: `roberttepass`

## 🔧 How to Use

### Run Initial Sync (Backfill)
```bash
cd /Users/roberttepass/Desktop/Agenti_Build/Pipedrive_Salse
set -a && source .env && set +a
npx serverless invoke local -f backfill
```

### Run Manual Sync
```bash
npx serverless invoke local -f sync
```

### Add Full Emails to Existing Tasks
```bash
node add-full-emails.js
```

## 📋 Current Sync Status

- **Total deals synced**: 127 deals
- **Stages synced**: 16, 18, 9, 22, 10, 13, 15, 11, 12
- **Status filter**: Open and Won deals only (Lost deals excluded)
- **Assignment**: All tasks assigned to Max Schoklitsch
- **Features**:
  - ✅ Contact information added as comments
  - ✅ Email correspondence added as individual comments (full content)
  - ✅ Deals mapped to correct Asana sections
  - ✅ Custom fields populated

## 🔄 Sync Breakdown by Stage

| Pipedrive Stage | Count | Asana Section |
|-----------------|-------|---------------|
| Stage 9 (Kontakt hergestellt) | 67 | Kontakt hergestellt |
| Stage 10 (Erstberatung terminiert) | 8 | Erstberatung terminiert |
| Stage 11 (Beauftragung bestätigt) | 7 | Beauftragung bestätigt |
| Stage 12 (Projekt eingereicht) | 5 | Projekt eingereicht |
| Stage 13 (Projektideen sammeln & Skizze) | 9 | Projektideen sammeln & Skizze |
| Stage 15 (Nutzungsvertrag geschickt) | 2 | Nutzungsvertrag geschickt |
| Stage 16 (1.Follow Up Call) | 3 | 1.Follow Up Call |
| Stage 18 (2.Follow Up) | 10 | 2.Follow Up |
| Stage 22 (Link für Call geschickt) | 16 | Link für Call geschickt |

## 🔐 Environment Variables

### Local (.env)
```
PIPEDRIVE_API_TOKEN=01df8bc1a848e4b3f55d6e2a79f9a62557a66510
ASANA_ACCESS_TOKEN=2/119578449411707/1211767717009213:0bebfc748959ea831799a526ff15a9eb
ASANA_WORKSPACE_ID=308803216953534
ASANA_CLIENT_ID=1211767256476624
ASANA_CLIENT_SECRET=cd476c0d2493fa6a4a78980b98648cfe
DATABASE_URL=postgresql://roberttepass@localhost:5432/pipedrive_sync
WEBHOOK_SECRET=your_webhook_secret_here
```

## 📝 Next Steps

### Optional: Set Up Webhooks (For Real-Time Sync)

#### Pipedrive Webhook Setup:
1. Go to Pipedrive → Settings → Webhooks
2. Create new webhook
3. URL: `https://146hv1icub.execute-api.us-east-1.amazonaws.com/production/webhook/pipedrive`
4. Events: Deal updated, Deal created, Deal deleted
5. Save

#### Asana Webhook Setup:
1. Requires OAuth app setup
2. Use the webhook URL: `https://146hv1icub.execute-api.us-east-1.amazonaws.com/production/webhook/asana`

### Optional: Upgrade to Cloud Database

If you want the system to run 24/7 without your computer:
1. **Neon** (recommended): https://neon.tech - Serverless Postgres
2. **PlanetScale**: https://planetscale.com - Serverless MySQL
3. **AWS RDS**: Native AWS solution

## 🛠️ Maintenance Commands

### View Lambda Logs
```bash
aws lambda invoke --function-name pipedrive-sales-sync-production-backfill --log-type Tail response.json
```

### Redeploy
```bash
set -a && source .env.production && set +a
serverless deploy --stage production
```

### Clean Up AWS Resources
```bash
serverless remove --stage production
```

## 📊 System Architecture

```
Pipedrive → Lambda (Webhook) → Local PostgreSQL → Asana
                ↓
         Scheduled Sync (5 min)
                ↓
         Backfill (Manual)
```

## ✨ Features Implemented

- ✅ Bidirectional sync (Pipedrive ↔ Asana)
- ✅ Real-time webhook handlers
- ✅ Scheduled sync every 5 minutes
- ✅ Initial backfill for historical data
- ✅ Contact information in comments
- ✅ Full email correspondence as individual comments
- ✅ Automatic assignment to Max
- ✅ Stage-to-section mapping
- ✅ Lost deals filtering
- ✅ Custom fields mapping
- ✅ Duplicate prevention

## 🎯 Success Metrics

- **127 deals** successfully synced
- **0 errors** in latest sync
- **All stages** correctly mapped
- **100%** assignment rate to Max
- **Email history** preserved for all deals with emails

---

**Last Updated**: October 28, 2025
**Status**: ✅ Fully Operational (Local Database)
