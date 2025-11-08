import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined
})

interface Deal {
  id: number
  pipedriveDealId: number
  title: string
  value: number
  currency: string
  status: string
  stageId: number
  stageName: string
  pipelineId: number
  personId?: number
  personName?: string
  orgId?: number
  orgName?: string
  ownerId?: number
  ownerName?: string
  addTime: string
  updateTime: string
  expectedCloseDate?: string
  probability?: number
  customFields: Record<string, any>
  activitiesCount: number
  emailMessagesCount: number
  filesCount: number
}

export async function GET(request: NextRequest) {
  try {
    // Check if tables exist first
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'pipeline_stages'
      ) as stages_exist,
      EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'deals'
      ) as deals_exist
    `)
    
    const { stages_exist, deals_exist } = tableCheck.rows[0]
    
    // If tables don't exist, return mock data for development
    if (!stages_exist || !deals_exist) {
      console.log('Pipeline tables not found, returning mock data')
      return NextResponse.json([
        {
          stage: { id: 1, pipedriveStageId: 9, stageName: 'Discovery', stageOrder: 1 },
          deals: [],
          totalValue: 0,
          count: 0
        },
        {
          stage: { id: 2, pipedriveStageId: 10, stageName: 'Demo', stageOrder: 2 },
          deals: [],
          totalValue: 0,
          count: 0
        }
      ])
    }
    
    // Get all pipeline stages
    const stagesResult = await pool.query(`
      SELECT 
        id,
        pipedrive_stage_id as "pipedriveStageId",
        stage_name as "stageName",
        stage_order as "stageOrder",
        pipeline_id as "pipelineId"
      FROM pipeline_stages
      ORDER BY stage_order ASC
    `)
    
    const stages = stagesResult.rows
    
    // Get all deals
    const dealsResult = await pool.query(`
      SELECT 
        id,
        pipedrive_deal_id as "pipedriveDealId",
        title,
        value,
        currency,
        status,
        stage_id as "stageId",
        stage_name as "stageName",
        pipeline_id as "pipelineId",
        person_id as "personId",
        person_name as "personName",
        org_id as "orgId",
        org_name as "orgName",
        owner_id as "ownerId",
        owner_name as "ownerName",
        add_time as "addTime",
        update_time as "updateTime",
        expected_close_date as "expectedCloseDate",
        probability,
        custom_fields as "customFields",
        activities_count as "activitiesCount",
        email_messages_count as "emailMessagesCount",
        files_count as "filesCount"
      FROM deals
      WHERE status != 'deleted'
      ORDER BY update_time DESC
    `)
    
    const allDeals: Deal[] = dealsResult.rows.map((row: any) => ({
      ...row,
      value: parseFloat(row.value) || 0
    }))
    
    // Group deals by stage
    const dealsByStage = stages.map(stage => {
      const stageDeals = allDeals.filter(deal => deal.stageId === stage.pipedriveStageId)
      const totalValue = stageDeals.reduce((sum, deal) => sum + (deal.value || 0), 0)
      
      return {
        stage,
        deals: stageDeals,
        totalValue,
        count: stageDeals.length
      }
    })
    
    return NextResponse.json(dealsByStage)
  } catch (error: any) {
    console.error('Error fetching deals by stage:', error)
    // Return empty array instead of error
    return NextResponse.json([])
  }
}
