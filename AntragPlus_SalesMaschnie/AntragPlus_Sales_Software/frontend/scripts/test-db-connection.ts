/**
 * Test Database Connection
 * Simple script to verify PostgreSQL connection works
 */

import { Pool } from 'pg'

async function testConnection() {
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL

  if (!connectionString) {
    console.log('❌ No DATABASE_URL or POSTGRES_URL found in environment')
    console.log('💡 Set DATABASE_URL in .env.local to connect to PostgreSQL')
    console.log('')
    console.log('Example:')
    console.log('DATABASE_URL=postgresql://localhost:5432/antragplus_sales')
    console.log('')
    process.exit(1)
  }

  console.log('🔌 Testing database connection...')
  console.log('📍 Connection string:', connectionString.replace(/:[^:@]+@/, ':****@'))

  const pool = new Pool({
    connectionString,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  })

  try {
    // Test connection
    const result = await pool.query('SELECT NOW() as now, version() as version')
    console.log('✅ Connection successful!')
    console.log('⏰ Server time:', result.rows[0].now)
    console.log('🗄️  PostgreSQL version:', result.rows[0].version.split(' ')[0])
    console.log('')

    // Check if tables exist
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('leads', 'lead_enrichment_history', 'lead_tags', 'lead_notes')
      ORDER BY table_name
    `)

    if (tablesResult.rows.length === 0) {
      console.log('⚠️  No lead tables found')
      console.log('💡 Run the schema creation script:')
      console.log('   psql $DATABASE_URL < ../src/shared/leads-schema.sql')
      console.log('')
    } else {
      console.log('✅ Found lead tables:')
      tablesResult.rows.forEach((row: any) => {
        console.log(`   - ${row.table_name}`)
      })
      console.log('')

      // Count leads
      const countResult = await pool.query('SELECT COUNT(*) as count FROM leads WHERE is_deleted = FALSE')
      console.log(`📊 Total leads in database: ${countResult.rows[0].count}`)
      console.log('')
    }

    console.log('✨ Database is ready!')
  } catch (error: any) {
    console.error('❌ Connection failed:', error.message)
    console.log('')
    console.log('Troubleshooting:')
    console.log('1. Is PostgreSQL running? Check with: pg_isready')
    console.log('2. Is the DATABASE_URL correct?')
    console.log('3. Can you connect manually? Try: psql $DATABASE_URL')
    console.log('')
    process.exit(1)
  } finally {
    await pool.end()
  }
}

testConnection()

