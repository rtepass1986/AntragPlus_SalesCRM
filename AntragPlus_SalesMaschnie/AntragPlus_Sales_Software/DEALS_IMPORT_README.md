# Pipedrive Deals Import System

This system imports all deals from Pipedrive into a local PostgreSQL database with full details and displays them in the frontend organized by pipeline stages matching Pipedrive 1:1.

## Features

✅ **Complete Deal Import**: Imports all deals with all available fields from Pipedrive  
✅ **Full Details**: Includes persons, organizations, activities, notes, and files  
✅ **Pipeline Stages**: Fetches and stores actual Pipedrive pipeline stages  
✅ **1:1 Mapping**: Frontend pipeline view matches Pipedrive stages exactly  
✅ **Drag & Drop**: Move deals between stages with visual drag-and-drop  
✅ **Real-time Stats**: View total deals, pipeline value, and metrics by stage  

## Components Created

### Backend

1. **Database Schema** (`src/shared/deals-schema.sql`)
   - `pipeline_stages` - Stores Pipedrive pipeline stages
   - `deals` - Stores all deal information
   - `deal_activities` - Stores activities linked to deals
   - `deal_notes` - Stores notes for deals
   - `deal_files` - Stores files attached to deals
   - `persons` - Stores contact information
   - `organizations` - Stores organization data

2. **Import Script** (`src/crm/import-pipedrive-deals.ts`)
   - Fetches all deals from Pipedrive API
   - Imports complete deal details
   - Handles pagination automatically
   - Includes error handling and progress logging

3. **API Endpoints** (`src/crm/deals-api.ts`)
   - `GET /deals/stages` - Get pipeline stages
   - `GET /deals/by-stage` - Get deals organized by stage
   - `GET /deals` - Get deals with filters
   - `GET /deals/:id` - Get individual deal details
   - `GET /deals/stats` - Get pipeline statistics

### Frontend

1. **Next.js API Routes**
   - `/api/crm/deals/stages` - Serves pipeline stages
   - `/api/crm/deals/by-stage` - Serves deals grouped by stage

2. **Updated Components**
   - `PipelineBoard.tsx` - Now uses dynamic Pipedrive stages
   - Pipeline page - Loads real deals from database
   - Automatic color coding based on stage names

## Setup Instructions

### 1. Environment Variables

Make sure your `.env` file contains:

```env
# Pipedrive Configuration
PIPEDRIVE_API_TOKEN=your_pipedrive_api_token
PIPEDRIVE_DOMAIN=your_company_name

# Database Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/database_name
```

### 2. Initialize Database

The database schema will be automatically created when you run the import script. Alternatively, you can manually run:

```bash
psql $DATABASE_URL < src/shared/deals-schema.sql
```

### 3. Run the Import

Import all deals from Pipedrive:

```bash
npm run import:deals
```

Or using ts-node directly:

```bash
npx ts-node src/crm/import-pipedrive-deals.ts
```

### 4. View in Frontend

1. Start the frontend development server:
   ```bash
   cd frontend
   npm run dev
   ```

2. Navigate to: `http://localhost:3000/dashboard/crm/pipeline`

3. You should see all your Pipedrive deals organized by stages

## Import Process

The import script performs the following steps:

1. **Initialize Database**: Creates all necessary tables and indexes
2. **Fetch Pipeline Stages**: Gets all pipeline stages from Pipedrive
3. **Fetch Deals**: Retrieves all deals with pagination (500 per batch)
4. **Import Deal Details**: For each deal:
   - Saves deal with all fields and custom fields
   - Fetches and saves associated person/contact
   - Fetches and saves associated organization
   - Fetches and saves all activities
   - Fetches and saves all notes
   - Fetches and saves all files

5. **Progress Reporting**: Shows progress every 10 deals
6. **Final Summary**: Displays total imported and any errors

## Pipeline View Features

### Drag & Drop
- Drag deals between pipeline stages
- Optimistic UI updates
- Automatic sync to Pipedrive

### Stage Columns
Each column shows:
- Stage name (matching Pipedrive)
- Number of deals in stage
- Total value in stage
- Color coding based on stage type

### Deal Cards
Each deal card displays:
- Deal title
- Organization name
- Contact name
- Deal value
- Expected close date
- Deal probability

## Data Structure

### Deal Fields Imported

```typescript
interface Deal {
  // Basic Information
  id, pipedriveDealId, title, value, currency, status
  
  // Stage Information
  stageId, stageName, pipelineId
  
  // Related Entities
  personId, personName, orgId, orgName
  ownerId, ownerName
  
  // Dates
  addTime, updateTime, closeTime, wonTime, lostTime
  expectedCloseDate
  
  // Additional Info
  probability, lostReason, notes
  
  // Custom Fields (JSON)
  customFields
  
  // Metrics
  activitiesCount, emailMessagesCount, filesCount
  notesCount, followersCount, participantsCount
}
```

## Maintenance

### Re-import Deals

To update deals from Pipedrive, simply run the import script again:

```bash
npm run import:deals
```

The script uses `ON CONFLICT` clauses to update existing records, so it's safe to run multiple times.

### Incremental Updates

For incremental updates (recommended for production):

1. Set up Pipedrive webhooks pointing to your backend
2. Use the existing `src/sync/pdWebhook.ts` for real-time updates
3. Run full import periodically (e.g., daily) for consistency

## Troubleshooting

### Import Fails

**Check environment variables:**
```bash
echo $PIPEDRIVE_API_TOKEN
echo $DATABASE_URL
```

**Check Pipedrive API access:**
```bash
curl "https://api.pipedrive.com/v1/deals?api_token=YOUR_TOKEN&limit=1"
```

**Check database connection:**
```bash
psql $DATABASE_URL -c "SELECT 1;"
```

### Frontend Not Showing Deals

1. Check browser console for errors
2. Verify database has data:
   ```sql
   SELECT COUNT(*) FROM deals;
   SELECT COUNT(*) FROM pipeline_stages;
   ```
3. Check API routes are working:
   ```bash
   curl http://localhost:3000/api/crm/deals/stages
   curl http://localhost:3000/api/crm/deals/by-stage
   ```

### Missing Deals

- Check if deals are in stages being synced
- Verify deals status is not 'deleted'
- Check the `STAGES_TO_SYNC` configuration in `src/sync/mapping.ts`

## Performance

### Import Speed
- Approximately 100 deals per minute
- Includes all related data (activities, notes, files)
- Rate-limited to respect Pipedrive API limits

### Database Indexes
The schema includes indexes on:
- `deals.stage_id`
- `deals.status`
- `deals.org_id`
- `deals.person_id`
- `deals.update_time`

### Frontend Performance
- Lazy loading for large pipelines
- Optimistic UI updates
- Efficient drag-and-drop with `@dnd-kit`

## Next Steps

### Recommended Enhancements

1. **Real-time Sync**: Set up Pipedrive webhooks for automatic updates
2. **Deal Creation**: Add UI to create new deals directly from frontend
3. **Deal Editing**: Enable inline editing of deal fields
4. **Filtering**: Add filters by owner, date range, value
5. **Search**: Implement full-text search across deals
6. **Analytics**: Add conversion rates, win rates, and forecasting

## Support

For issues or questions:
1. Check this README
2. Review the code comments in the implementation files
3. Check Pipedrive API documentation: https://developers.pipedrive.com/

