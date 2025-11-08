#!/usr/bin/env ts-node
/**
 * Import all deals from Pipedrive with full details
 * 
 * This script:
 * 1. Fetches all pipeline stages from Pipedrive
 * 2. Fetches all deals with complete details
 * 3. Fetches associated persons, organizations, activities, notes, and files
 * 4. Stores everything in the local database
 */

import 'dotenv/config';
import { Pool } from 'pg';
import axios from 'axios';
import { logger } from '../lead/utils/logger';

const PIPEDRIVE_API_TOKEN = process.env.PIPEDRIVE_API_TOKEN;
const PIPEDRIVE_DOMAIN = process.env.PIPEDRIVE_DOMAIN || 'https://api.pipedrive.com/v1';
const DATABASE_URL = process.env.DATABASE_URL;

if (!PIPEDRIVE_API_TOKEN) {
  throw new Error('PIPEDRIVE_API_TOKEN environment variable is required');
}

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Pipedrive API client
const pipedriveApi = axios.create({
  baseURL: PIPEDRIVE_DOMAIN,
  params: {
    api_token: PIPEDRIVE_API_TOKEN
  }
});

interface PipelineStage {
  id: number;
  name: string;
  order_nr: number;
  pipeline_id: number;
}

interface PipedriveDeal {
  id: number;
  title: string;
  value: number;
  currency: string;
  status: string;
  stage_id: number;
  pipeline_id: number;
  person_id: any;
  person_name?: string;
  org_id: any;
  org_name?: string;
  owner_id: number;
  owner_name?: string;
  user_id?: number;
  add_time: string;
  update_time: string;
  close_time?: string;
  won_time?: string;
  lost_time?: string;
  expected_close_date?: string;
  probability?: number;
  lost_reason?: string;
  visible_to?: string;
  notes?: string;
  [key: string]: any; // for custom fields
}

async function initDatabase() {
  logger.info('Initializing database schema...');
  
  const schemaSQL = require('fs').readFileSync(
    require('path').join(__dirname, '../shared/deals-schema.sql'),
    'utf8'
  );
  
  await pool.query(schemaSQL);
  logger.info('✅ Database schema initialized');
}

async function fetchPipelineStages(): Promise<PipelineStage[]> {
  logger.info('Fetching pipeline stages from Pipedrive...');
  
  const response = await pipedriveApi.get('/stages');
  const stages = response.data.data as PipelineStage[];
  
  logger.info(`✅ Fetched ${stages.length} pipeline stages`);
  return stages;
}

async function savePipelineStages(stages: PipelineStage[]) {
  logger.info('Saving pipeline stages to database...');
  
  for (const stage of stages) {
    await pool.query(`
      INSERT INTO pipeline_stages (pipedrive_stage_id, stage_name, stage_order, pipeline_id)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (pipedrive_stage_id) 
      DO UPDATE SET 
        stage_name = EXCLUDED.stage_name,
        stage_order = EXCLUDED.stage_order,
        pipeline_id = EXCLUDED.pipeline_id,
        updated_at = CURRENT_TIMESTAMP
    `, [stage.id, stage.name, stage.order_nr, stage.pipeline_id]);
  }
  
  logger.info('✅ Pipeline stages saved');
}

async function fetchAllDeals(): Promise<PipedriveDeal[]> {
  logger.info('Fetching all deals from Pipedrive...');
  
  let allDeals: PipedriveDeal[] = [];
  let start = 0;
  const limit = 500;
  let hasMore = true;
  
  while (hasMore) {
    const response = await pipedriveApi.get('/deals', {
      params: {
        start,
        limit,
        status: 'all_not_deleted' // Get all active deals
      }
    });
    
    const deals = response.data.data || [];
    allDeals = allDeals.concat(deals);
    
    logger.info(`Fetched ${deals.length} deals (total: ${allDeals.length})`);
    
    hasMore = response.data.additional_data?.pagination?.more_items_in_collection || false;
    start = response.data.additional_data?.pagination?.next_start || 0;
    
    if (deals.length === 0) break;
  }
  
  logger.info(`✅ Fetched ${allDeals.length} total deals`);
  return allDeals;
}

async function fetchDealDetails(dealId: number): Promise<any> {
  try {
    const response = await pipedriveApi.get(`/deals/${dealId}`);
    return response.data.data;
  } catch (error) {
    logger.error({ dealId, error }, 'Error fetching deal details');
    return null;
  }
}

async function fetchDealActivities(dealId: number): Promise<any[]> {
  try {
    const response = await pipedriveApi.get(`/deals/${dealId}/activities`);
    return response.data.data || [];
  } catch (error) {
    logger.error({ dealId, error }, 'Error fetching deal activities');
    return [];
  }
}

async function fetchDealNotes(dealId: number): Promise<any[]> {
  try {
    const response = await pipedriveApi.get(`/deals/${dealId}/notes`);
    return response.data.data || [];
  } catch (error) {
    logger.error({ dealId, error }, 'Error fetching deal notes');
    return [];
  }
}

async function fetchDealFiles(dealId: number): Promise<any[]> {
  try {
    const response = await pipedriveApi.get(`/deals/${dealId}/files`);
    return response.data.data || [];
  } catch (error) {
    logger.error({ dealId, error }, 'Error fetching deal files');
    return [];
  }
}

async function fetchPerson(personId: number): Promise<any> {
  try {
    const response = await pipedriveApi.get(`/persons/${personId}`);
    return response.data.data;
  } catch (error) {
    logger.error({ personId, error }, 'Error fetching person');
    return null;
  }
}

async function fetchOrganization(orgId: number): Promise<any> {
  try {
    const response = await pipedriveApi.get(`/organizations/${orgId}`);
    return response.data.data;
  } catch (error) {
    logger.error({ orgId, error }, 'Error fetching organization');
    return null;
  }
}

async function saveDeal(deal: PipedriveDeal, stageMapping: Map<number, string>) {
  const stageName = stageMapping.get(deal.stage_id) || 'Unknown';
  
  // Extract custom fields (fields starting with hash or custom field keys)
  const customFields: Record<string, any> = {};
  Object.keys(deal).forEach(key => {
    if (key.startsWith('hash') || /^[a-f0-9]{40}$/.test(key)) {
      customFields[key] = deal[key];
    }
  });
  
  await pool.query(`
    INSERT INTO deals (
      pipedrive_deal_id, title, value, currency, status,
      stage_id, stage_name, pipeline_id,
      person_id, person_name,
      org_id, org_name,
      owner_id, owner_name, user_id,
      add_time, update_time, close_time, won_time, lost_time,
      expected_close_date, probability, lost_reason, visible_to, notes,
      custom_fields,
      activities_count, done_activities_count, undone_activities_count,
      email_messages_count, files_count, notes_count,
      followers_count, participants_count,
      last_synced_at
    )
    VALUES (
      $1, $2, $3, $4, $5,
      $6, $7, $8,
      $9, $10,
      $11, $12,
      $13, $14, $15,
      $16, $17, $18, $19, $20,
      $21, $22, $23, $24, $25,
      $26,
      $27, $28, $29,
      $30, $31, $32,
      $33, $34,
      CURRENT_TIMESTAMP
    )
    ON CONFLICT (pipedrive_deal_id) 
    DO UPDATE SET
      title = EXCLUDED.title,
      value = EXCLUDED.value,
      currency = EXCLUDED.currency,
      status = EXCLUDED.status,
      stage_id = EXCLUDED.stage_id,
      stage_name = EXCLUDED.stage_name,
      pipeline_id = EXCLUDED.pipeline_id,
      person_id = EXCLUDED.person_id,
      person_name = EXCLUDED.person_name,
      org_id = EXCLUDED.org_id,
      org_name = EXCLUDED.org_name,
      owner_id = EXCLUDED.owner_id,
      owner_name = EXCLUDED.owner_name,
      user_id = EXCLUDED.user_id,
      update_time = EXCLUDED.update_time,
      close_time = EXCLUDED.close_time,
      won_time = EXCLUDED.won_time,
      lost_time = EXCLUDED.lost_time,
      expected_close_date = EXCLUDED.expected_close_date,
      probability = EXCLUDED.probability,
      lost_reason = EXCLUDED.lost_reason,
      visible_to = EXCLUDED.visible_to,
      notes = EXCLUDED.notes,
      custom_fields = EXCLUDED.custom_fields,
      activities_count = EXCLUDED.activities_count,
      done_activities_count = EXCLUDED.done_activities_count,
      undone_activities_count = EXCLUDED.undone_activities_count,
      email_messages_count = EXCLUDED.email_messages_count,
      files_count = EXCLUDED.files_count,
      notes_count = EXCLUDED.notes_count,
      followers_count = EXCLUDED.followers_count,
      participants_count = EXCLUDED.participants_count,
      last_synced_at = CURRENT_TIMESTAMP,
      updated_at = CURRENT_TIMESTAMP
    RETURNING id
  `, [
    deal.id, deal.title, deal.value || 0, deal.currency || 'EUR', deal.status,
    deal.stage_id, stageName, deal.pipeline_id,
    deal.person_id?.value || deal.person_id, deal.person_name,
    deal.org_id?.value || deal.org_id, deal.org_name,
    deal.owner_id, deal.owner_name, deal.user_id,
    deal.add_time, deal.update_time, deal.close_time, deal.won_time, deal.lost_time,
    deal.expected_close_date, deal.probability, deal.lost_reason, deal.visible_to, deal.notes,
    JSON.stringify(customFields),
    deal.activities_count || 0, deal.done_activities_count || 0, deal.undone_activities_count || 0,
    deal.email_messages_count || 0, deal.files_count || 0, deal.notes_count || 0,
    deal.followers_count || 0, deal.participants_count || 0
  ]);
}

async function savePerson(person: any) {
  if (!person) return;
  
  await pool.query(`
    INSERT INTO persons (
      pipedrive_person_id, name, first_name, last_name,
      owner_id, owner_name,
      email, phone,
      org_id, org_name,
      custom_fields,
      open_deals_count, closed_deals_count, activities_count,
      add_time, update_time,
      last_synced_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, CURRENT_TIMESTAMP)
    ON CONFLICT (pipedrive_person_id)
    DO UPDATE SET
      name = EXCLUDED.name,
      first_name = EXCLUDED.first_name,
      last_name = EXCLUDED.last_name,
      email = EXCLUDED.email,
      phone = EXCLUDED.phone,
      org_id = EXCLUDED.org_id,
      org_name = EXCLUDED.org_name,
      open_deals_count = EXCLUDED.open_deals_count,
      closed_deals_count = EXCLUDED.closed_deals_count,
      activities_count = EXCLUDED.activities_count,
      last_synced_at = CURRENT_TIMESTAMP,
      updated_at = CURRENT_TIMESTAMP
  `, [
    person.id,
    person.name,
    person.first_name,
    person.last_name,
    person.owner_id?.value || person.owner_id,
    person.owner_id?.name,
    person.email || [],
    person.phone || [],
    person.org_id?.value || person.org_id,
    person.org_name,
    JSON.stringify({}),
    person.open_deals_count || 0,
    person.closed_deals_count || 0,
    person.activities_count || 0,
    person.add_time,
    person.update_time
  ]);
}

async function saveOrganization(org: any) {
  if (!org) return;
  
  await pool.query(`
    INSERT INTO organizations (
      pipedrive_org_id, name, owner_id, owner_name,
      address, website, phone, email,
      custom_fields,
      people_count, open_deals_count, closed_deals_count,
      won_deals_count, lost_deals_count,
      add_time, update_time,
      last_synced_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, CURRENT_TIMESTAMP)
    ON CONFLICT (pipedrive_org_id)
    DO UPDATE SET
      name = EXCLUDED.name,
      address = EXCLUDED.address,
      website = EXCLUDED.website,
      phone = EXCLUDED.phone,
      email = EXCLUDED.email,
      people_count = EXCLUDED.people_count,
      open_deals_count = EXCLUDED.open_deals_count,
      closed_deals_count = EXCLUDED.closed_deals_count,
      won_deals_count = EXCLUDED.won_deals_count,
      lost_deals_count = EXCLUDED.lost_deals_count,
      last_synced_at = CURRENT_TIMESTAMP,
      updated_at = CURRENT_TIMESTAMP
  `, [
    org.id,
    org.name,
    org.owner_id?.value || org.owner_id,
    org.owner_id?.name,
    org.address,
    org.website,
    org.phone,
    org.email,
    JSON.stringify({}),
    org.people_count || 0,
    org.open_deals_count || 0,
    org.closed_deals_count || 0,
    org.won_deals_count || 0,
    org.lost_deals_count || 0,
    org.add_time,
    org.update_time
  ]);
}

async function saveDealActivity(activity: any, dealDbId: number, pipedriveDealId: number) {
  if (!activity) return;
  
  await pool.query(`
    INSERT INTO deal_activities (
      pipedrive_activity_id, deal_id, pipedrive_deal_id,
      subject, type, due_date, due_time, duration,
      user_id, person_id, org_id,
      done, marked_as_done_time,
      note,
      add_time, update_time
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
    ON CONFLICT (pipedrive_activity_id)
    DO UPDATE SET
      subject = EXCLUDED.subject,
      done = EXCLUDED.done,
      marked_as_done_time = EXCLUDED.marked_as_done_time,
      note = EXCLUDED.note,
      updated_at = CURRENT_TIMESTAMP
  `, [
    activity.id,
    dealDbId,
    pipedriveDealId,
    activity.subject,
    activity.type,
    activity.due_date,
    activity.due_time,
    activity.duration,
    activity.user_id,
    activity.person_id,
    activity.org_id,
    activity.done || false,
    activity.marked_as_done_time,
    activity.note,
    activity.add_time,
    activity.update_time
  ]);
}

async function saveDealNote(note: any, dealDbId: number, pipedriveDealId: number) {
  if (!note) return;
  
  await pool.query(`
    INSERT INTO deal_notes (
      pipedrive_note_id, deal_id, pipedrive_deal_id,
      content, user_id,
      add_time, update_time
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    ON CONFLICT (pipedrive_note_id)
    DO UPDATE SET
      content = EXCLUDED.content,
      updated_at = CURRENT_TIMESTAMP
  `, [
    note.id,
    dealDbId,
    pipedriveDealId,
    note.content,
    note.user_id,
    note.add_time,
    note.update_time
  ]);
}

async function saveDealFile(file: any, dealDbId: number, pipedriveDealId: number) {
  if (!file) return;
  
  await pool.query(`
    INSERT INTO deal_files (
      pipedrive_file_id, deal_id, pipedrive_deal_id,
      file_name, file_type, file_size,
      remote_location, url,
      add_time, update_time
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    ON CONFLICT (pipedrive_file_id)
    DO UPDATE SET
      file_name = EXCLUDED.file_name,
      url = EXCLUDED.url,
      updated_at = CURRENT_TIMESTAMP
  `, [
    file.id,
    dealDbId,
    pipedriveDealId,
    file.name,
    file.file_type,
    file.file_size,
    file.remote_location,
    file.url,
    file.add_time,
    file.update_time
  ]);
}

async function main() {
  try {
    logger.info('🚀 Starting Pipedrive deals import...');
    
    // Initialize database
    await initDatabase();
    
    // Fetch and save pipeline stages
    const stages = await fetchPipelineStages();
    await savePipelineStages(stages);
    
    // Create stage mapping
    const stageMapping = new Map<number, string>();
    stages.forEach(stage => {
      stageMapping.set(stage.id, stage.name);
    });
    
    // Fetch all deals
    const deals = await fetchAllDeals();
    
    logger.info(`📊 Importing ${deals.length} deals with full details...`);
    
    let importedCount = 0;
    let errorCount = 0;
    
    // Process each deal
    for (const deal of deals) {
      try {
        // Save the deal
        await saveDeal(deal, stageMapping);
        
        // Get the database ID
        const result = await pool.query(
          'SELECT id FROM deals WHERE pipedrive_deal_id = $1',
          [deal.id]
        );
        const dealDbId = result.rows[0]?.id;
        
        if (!dealDbId) {
          logger.warn({ dealId: deal.id }, 'Could not find database ID for deal');
          continue;
        }
        
        // Fetch and save person if exists
        if (deal.person_id) {
          const personId = deal.person_id?.value || deal.person_id;
          const person = await fetchPerson(personId);
          if (person) {
            await savePerson(person);
          }
        }
        
        // Fetch and save organization if exists
        if (deal.org_id) {
          const orgId = deal.org_id?.value || deal.org_id;
          const org = await fetchOrganization(orgId);
          if (org) {
            await saveOrganization(org);
          }
        }
        
        // Fetch and save activities
        const activities = await fetchDealActivities(deal.id);
        for (const activity of activities) {
          await saveDealActivity(activity, dealDbId, deal.id);
        }
        
        // Fetch and save notes
        const notes = await fetchDealNotes(deal.id);
        for (const note of notes) {
          await saveDealNote(note, dealDbId, deal.id);
        }
        
        // Fetch and save files
        const files = await fetchDealFiles(deal.id);
        for (const file of files) {
          await saveDealFile(file, dealDbId, deal.id);
        }
        
        importedCount++;
        
        if (importedCount % 10 === 0) {
          logger.info(`Progress: ${importedCount}/${deals.length} deals imported`);
        }
        
      } catch (error) {
        errorCount++;
        logger.error({ dealId: deal.id, error }, 'Error importing deal');
      }
    }
    
    logger.info('='.repeat(80));
    logger.info('✅ IMPORT COMPLETE');
    logger.info('='.repeat(80));
    logger.info(`Total deals: ${deals.length}`);
    logger.info(`Successfully imported: ${importedCount}`);
    logger.info(`Errors: ${errorCount}`);
    logger.info('='.repeat(80));
    
  } catch (error) {
    logger.error({ error }, 'Fatal error during import');
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the import
if (require.main === module) {
  main().catch(error => {
    console.error('Import failed:', error);
    process.exit(1);
  });
}

export { main as importPipedriveDeals };

