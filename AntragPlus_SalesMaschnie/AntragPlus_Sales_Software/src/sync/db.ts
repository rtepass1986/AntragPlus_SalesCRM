import { Pool, PoolClient } from 'pg';
import { config } from './env';
import { SyncMapping } from './mapping';

let pool: Pool | null = null;

export const getDbPool = (): Pool => {
  if (!pool) {
    pool = new Pool({
      connectionString: config.DATABASE_URL,
      ssl: config.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
  }
  return pool;
};

export const closeDbPool = async (): Promise<void> => {
  if (pool) {
    await pool.end();
    pool = null;
  }
};

export const initDatabase = async (): Promise<void> => {
  const client = await getDbPool().connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS sync_mappings (
        id SERIAL PRIMARY KEY,
        pipedrive_deal_id INTEGER UNIQUE NOT NULL,
        asana_task_id VARCHAR(255) UNIQUE NOT NULL,
        last_sync_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        sync_direction VARCHAR(50) DEFAULT 'bidirectional',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS sync_logs (
        id SERIAL PRIMARY KEY,
        pipedrive_deal_id INTEGER,
        asana_task_id VARCHAR(255),
        action VARCHAR(100) NOT NULL,
        status VARCHAR(50) NOT NULL,
        error_message TEXT,
        sync_data JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_sync_mappings_pipedrive_deal_id 
      ON sync_mappings(pipedrive_deal_id);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_sync_mappings_asana_task_id 
      ON sync_mappings(asana_task_id);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_sync_logs_created_at 
      ON sync_logs(created_at);
    `);
  } finally {
    client.release();
  }
};

export const saveSyncMapping = async (mapping: Omit<SyncMapping, 'lastSyncTime'>): Promise<void> => {
  const client = await getDbPool().connect();
  try {
    await client.query(`
      INSERT INTO sync_mappings (pipedrive_deal_id, asana_task_id, sync_direction)
      VALUES ($1, $2, $3)
      ON CONFLICT (pipedrive_deal_id) 
      DO UPDATE SET 
        asana_task_id = EXCLUDED.asana_task_id,
        sync_direction = EXCLUDED.sync_direction,
        updated_at = CURRENT_TIMESTAMP
    `, [mapping.pipedriveDealId, mapping.asanaTaskId, mapping.syncDirection]);
  } finally {
    client.release();
  }
};

export const getSyncMapping = async (pipedriveDealId: number): Promise<SyncMapping | null> => {
  const client = await getDbPool().connect();
  try {
    const result = await client.query(`
      SELECT pipedrive_deal_id, asana_task_id, last_sync_time, sync_direction
      FROM sync_mappings 
      WHERE pipedrive_deal_id = $1
    `, [pipedriveDealId]);

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      pipedriveDealId: row.pipedrive_deal_id,
      asanaTaskId: row.asana_task_id,
      lastSyncTime: new Date(row.last_sync_time),
      syncDirection: row.sync_direction
    };
  } finally {
    client.release();
  }
};

export const updateSyncTime = async (pipedriveDealId: number): Promise<void> => {
  const client = await getDbPool().connect();
  try {
    await client.query(`
      UPDATE sync_mappings 
      SET last_sync_time = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE pipedrive_deal_id = $1
    `, [pipedriveDealId]);
  } finally {
    client.release();
  }
};

export const logSyncAction = async (
  pipedriveDealId: number | null,
  asanaTaskId: string | null,
  action: string,
  status: 'success' | 'error',
  errorMessage?: string,
  syncData?: any
): Promise<void> => {
  const client = await getDbPool().connect();
  try {
    await client.query(`
      INSERT INTO sync_logs (pipedrive_deal_id, asana_task_id, action, status, error_message, sync_data)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [pipedriveDealId, asanaTaskId, action, status, errorMessage, syncData]);
  } finally {
    client.release();
  }
};
