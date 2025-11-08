/**
 * Deals API Handler
 * Provides endpoints to fetch deals data from the database
 */

import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

export interface Deal {
  id: number;
  pipedriveDealId: number;
  title: string;
  value: number;
  currency: string;
  status: string;
  stageId: number;
  stageName: string;
  pipelineId: number;
  personId?: number;
  personName?: string;
  orgId?: number;
  orgName?: string;
  ownerId?: number;
  ownerName?: string;
  addTime: string;
  updateTime: string;
  expectedCloseDate?: string;
  probability?: number;
  customFields: Record<string, any>;
  activitiesCount: number;
  emailMessagesCount: number;
  filesCount: number;
}

export interface PipelineStage {
  id: number;
  pipedriveStageId: number;
  stageName: string;
  stageOrder: number;
  pipelineId: number;
}

export interface DealsByStage {
  stage: PipelineStage;
  deals: Deal[];
  totalValue: number;
  count: number;
}

/**
 * Get all pipeline stages
 */
export async function getPipelineStages(): Promise<PipelineStage[]> {
  const result = await pool.query(`
    SELECT 
      id,
      pipedrive_stage_id as "pipedriveStageId",
      stage_name as "stageName",
      stage_order as "stageOrder",
      pipeline_id as "pipelineId"
    FROM pipeline_stages
    ORDER BY stage_order ASC
  `);
  
  return result.rows;
}

/**
 * Get all deals organized by stage
 */
export async function getDealsByStage(pipelineId?: number): Promise<DealsByStage[]> {
  // Get all stages
  const stages = await getPipelineStages();
  
  // Get all deals
  const dealsQuery = pipelineId
    ? `SELECT * FROM deals WHERE pipeline_id = $1 AND status != 'deleted' ORDER BY update_time DESC`
    : `SELECT * FROM deals WHERE status != 'deleted' ORDER BY update_time DESC`;
  
  const dealsResult = pipelineId
    ? await pool.query(dealsQuery, [pipelineId])
    : await pool.query(dealsQuery);
  
  const allDeals = dealsResult.rows.map(transformDeal);
  
  // Group deals by stage
  const dealsByStage: DealsByStage[] = stages.map(stage => {
    const stageDeals = allDeals.filter(deal => deal.stageId === stage.pipedriveStageId);
    const totalValue = stageDeals.reduce((sum, deal) => sum + (deal.value || 0), 0);
    
    return {
      stage,
      deals: stageDeals,
      totalValue,
      count: stageDeals.length
    };
  });
  
  return dealsByStage;
}

/**
 * Get a single deal by ID
 */
export async function getDealById(dealId: number): Promise<Deal | null> {
  const result = await pool.query(
    'SELECT * FROM deals WHERE id = $1',
    [dealId]
  );
  
  if (result.rows.length === 0) {
    return null;
  }
  
  return transformDeal(result.rows[0]);
}

/**
 * Get a single deal by Pipedrive ID
 */
export async function getDealByPipedriveId(pipedriveId: number): Promise<Deal | null> {
  const result = await pool.query(
    'SELECT * FROM deals WHERE pipedrive_deal_id = $1',
    [pipedriveId]
  );
  
  if (result.rows.length === 0) {
    return null;
  }
  
  return transformDeal(result.rows[0]);
}

/**
 * Get deals with filters
 */
export async function getDeals(filters: {
  stageId?: number;
  status?: string;
  ownerId?: number;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<{ deals: Deal[]; total: number }> {
  const conditions: string[] = ["status != 'deleted'"];
  const params: any[] = [];
  let paramCount = 1;
  
  if (filters.stageId) {
    conditions.push(`stage_id = $${paramCount++}`);
    params.push(filters.stageId);
  }
  
  if (filters.status) {
    conditions.push(`status = $${paramCount++}`);
    params.push(filters.status);
  }
  
  if (filters.ownerId) {
    conditions.push(`owner_id = $${paramCount++}`);
    params.push(filters.ownerId);
  }
  
  if (filters.search) {
    conditions.push(`(title ILIKE $${paramCount} OR org_name ILIKE $${paramCount} OR person_name ILIKE $${paramCount})`);
    params.push(`%${filters.search}%`);
    paramCount++;
  }
  
  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  
  // Get total count
  const countResult = await pool.query(
    `SELECT COUNT(*) as count FROM deals ${whereClause}`,
    params
  );
  const total = parseInt(countResult.rows[0].count);
  
  // Get deals
  const limit = filters.limit || 100;
  const offset = filters.offset || 0;
  
  const dealsResult = await pool.query(
    `SELECT * FROM deals ${whereClause} ORDER BY update_time DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
    [...params, limit, offset]
  );
  
  const deals = dealsResult.rows.map(transformDeal);
  
  return { deals, total };
}

/**
 * Get deal activities
 */
export async function getDealActivities(dealId: number) {
  const result = await pool.query(
    `SELECT * FROM deal_activities WHERE deal_id = $1 ORDER BY due_date DESC`,
    [dealId]
  );
  
  return result.rows;
}

/**
 * Get deal notes
 */
export async function getDealNotes(dealId: number) {
  const result = await pool.query(
    `SELECT * FROM deal_notes WHERE deal_id = $1 ORDER BY add_time DESC`,
    [dealId]
  );
  
  return result.rows;
}

/**
 * Get deal files
 */
export async function getDealFiles(dealId: number) {
  const result = await pool.query(
    `SELECT * FROM deal_files WHERE deal_id = $1 ORDER BY add_time DESC`,
    [dealId]
  );
  
  return result.rows;
}

/**
 * Get pipeline statistics
 */
export async function getPipelineStats() {
  const result = await pool.query(`
    SELECT 
      COUNT(*) as total_deals,
      SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) as open_deals,
      SUM(CASE WHEN status = 'won' THEN 1 ELSE 0 END) as won_deals,
      SUM(CASE WHEN status = 'lost' THEN 1 ELSE 0 END) as lost_deals,
      SUM(value) as total_value,
      SUM(CASE WHEN status = 'won' THEN value ELSE 0 END) as won_value,
      AVG(probability) as avg_probability
    FROM deals
    WHERE status != 'deleted'
  `);
  
  return result.rows[0];
}

/**
 * Transform database row to Deal object
 */
function transformDeal(row: any): Deal {
  return {
    id: row.id,
    pipedriveDealId: row.pipedrive_deal_id,
    title: row.title,
    value: parseFloat(row.value) || 0,
    currency: row.currency,
    status: row.status,
    stageId: row.stage_id,
    stageName: row.stage_name,
    pipelineId: row.pipeline_id,
    personId: row.person_id,
    personName: row.person_name,
    orgId: row.org_id,
    orgName: row.org_name,
    ownerId: row.owner_id,
    ownerName: row.owner_name,
    addTime: row.add_time,
    updateTime: row.update_time,
    expectedCloseDate: row.expected_close_date,
    probability: row.probability,
    customFields: row.custom_fields || {},
    activitiesCount: row.activities_count || 0,
    emailMessagesCount: row.email_messages_count || 0,
    filesCount: row.files_count || 0
  };
}

/**
 * Lambda handler for serverless deployment
 */
export const handler = async (event: any) => {
  const path = event.path || event.rawPath;
  const method = event.httpMethod || event.requestContext?.http?.method;
  
  try {
    // GET /deals/stages
    if (path === '/deals/stages' && method === 'GET') {
      const stages = await getPipelineStages();
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(stages)
      };
    }
    
    // GET /deals/by-stage
    if (path === '/deals/by-stage' && method === 'GET') {
      const pipelineId = event.queryStringParameters?.pipelineId;
      const dealsByStage = await getDealsByStage(pipelineId ? parseInt(pipelineId) : undefined);
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dealsByStage)
      };
    }
    
    // GET /deals
    if (path === '/deals' && method === 'GET') {
      const filters = event.queryStringParameters || {};
      const result = await getDeals(filters);
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result)
      };
    }
    
    // GET /deals/stats
    if (path === '/deals/stats' && method === 'GET') {
      const stats = await getPipelineStats();
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(stats)
      };
    }
    
    // GET /deals/:id
    const dealMatch = path.match(/^\/deals\/(\d+)$/);
    if (dealMatch && method === 'GET') {
      const dealId = parseInt(dealMatch[1]);
      const deal = await getDealById(dealId);
      
      if (!deal) {
        return {
          statusCode: 404,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Deal not found' })
        };
      }
      
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(deal)
      };
    }
    
    return {
      statusCode: 404,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Not found' })
    };
    
  } catch (error: any) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error.message })
    };
  }
};

