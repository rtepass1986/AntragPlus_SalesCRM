/**
 * Database Initialization Script for Training Module
 * Run this once to set up all training tables and initial data
 */

import { Pool } from 'pg'
import { readFileSync } from 'fs'
import { join } from 'path'

async function initializeTrainingDatabase() {
  const connectionString = process.env.DATABASE_URL

  if (!connectionString) {
    console.error('❌ DATABASE_URL environment variable not set')
    process.exit(1)
  }

  const pool = new Pool({
    connectionString,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  })

  try {
    console.log('🚀 Initializing Training Module Database...')
    console.log('')

    // Read schema file
    const schemaPath = join(__dirname, 'schema.sql')
    const schema = readFileSync(schemaPath, 'utf-8')

    // Execute schema
    console.log('📊 Creating tables...')
    await pool.query(schema)
    console.log('✅ Tables created successfully')
    console.log('')

    // Verify tables
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE '%journey%' 
      OR table_name LIKE '%script%'
      OR table_name LIKE '%template%'
      OR table_name LIKE '%firefly%'
      OR table_name LIKE '%training%'
      OR table_name LIKE '%test%'
      OR table_name LIKE '%ai_%'
      ORDER BY table_name
    `)

    console.log('📋 Created tables:')
    tablesResult.rows.forEach(row => {
      console.log(`   ✓ ${row.table_name}`)
    })
    console.log('')

    // Check if journey data was inserted
    const journeyCheck = await pool.query(`SELECT COUNT(*) as count FROM customer_journeys`)
    console.log(`📌 Customer journeys: ${journeyCheck.rows[0].count}`)

    const stagesCheck = await pool.query(`SELECT COUNT(*) as count FROM journey_stages`)
    console.log(`📌 Journey stages: ${stagesCheck.rows[0].count}`)

    const rulesCheck = await pool.query(`SELECT COUNT(*) as count FROM ai_automation_rules`)
    console.log(`📌 AI automation rules: ${rulesCheck.rows[0].count}`)
    console.log('')

    console.log('✨ Database initialization complete!')
    console.log('━'.repeat(60))
    console.log('')
    console.log('🎯 Next steps:')
    console.log('1. Start frontend: cd frontend && npm run dev')
    console.log('2. Visit: http://localhost:3000/dashboard/training')
    console.log('3. All training features are now functional!')
    console.log('')

  } catch (error) {
    console.error('❌ Error initializing database:', error)
    throw error
  } finally {
    await pool.end()
  }
}

// Run if called directly
if (require.main === module) {
  initializeTrainingDatabase()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error)
      process.exit(1)
    })
}

export { initializeTrainingDatabase }

