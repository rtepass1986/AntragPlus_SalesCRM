/**
 * PostgreSQL Database Client
 * Connection pool for database operations
 */

import { Pool, PoolClient } from 'pg'

class Database {
  private static instance: Database
  private pool: Pool | null = null

  private constructor() {
    this.initPool()
  }

  private initPool() {
    // Only initialize on server-side
    if (typeof window !== 'undefined') {
      return
    }

    const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL

    if (!connectionString) {
      console.warn('No DATABASE_URL found, database features will be disabled')
      return
    }

    this.pool = new Pool({
      connectionString,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    })

    this.pool.on('error', (err) => {
      console.error('Unexpected database pool error:', err)
    })

    console.log('✅ Database pool initialized')
  }

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database()
    }
    return Database.instance
  }

  public async query(text: string, params?: any[]) {
    if (!this.pool) {
      throw new Error('Database pool not initialized')
    }

    const start = Date.now()
    try {
      const result = await this.pool.query(text, params)
      const duration = Date.now() - start
      console.log('Executed query', { text, duration, rows: result.rowCount })
      return result
    } catch (error) {
      console.error('Database query error:', error)
      throw error
    }
  }

  public async getClient(): Promise<PoolClient> {
    if (!this.pool) {
      throw new Error('Database pool not initialized')
    }
    return this.pool.connect()
  }

  public async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.getClient()
    try {
      await client.query('BEGIN')
      const result = await callback(client)
      await client.query('COMMIT')
      return result
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  }

  public async close() {
    if (this.pool) {
      await this.pool.end()
      console.log('Database pool closed')
    }
  }

  public isInitialized(): boolean {
    return this.pool !== null
  }
}

// Export singleton instance
export const db = Database.getInstance()

// Helper function to check database connection
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    const result = await db.query('SELECT NOW() as now')
    console.log('✅ Database connection successful:', result.rows[0].now)
    return true
  } catch (error) {
    console.error('❌ Database connection failed:', error)
    return false
  }
}

