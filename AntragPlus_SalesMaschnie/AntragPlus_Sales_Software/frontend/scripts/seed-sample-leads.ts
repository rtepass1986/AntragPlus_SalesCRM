/**
 * Seed Sample Leads
 * Insert sample leads into database for testing
 */

import { Pool } from 'pg'

const sampleLeads = [
  {
    company_name: 'Deutscher Caritasverband e.V.',
    website: 'https://www.caritas.de',
    email: 'info@caritas.de',
    phone: '+49 761 200-0',
    address: 'Karlstraße 40, 79104 Freiburg',
    linkedin_url: 'https://linkedin.com/company/caritas-deutschland',
    industry: 'Sozialwesen',
    tätigkeitsfeld: 'Wohlfahrtsverband',
    legal_form: 'e.V.',
    founded_year: 1897,
    status: 'enriched',
    confidence: 0.95,
    tags: ['Wohlfahrtsverband', 'Sozialwesen', 'Non-Profit'],
    notes: 'Großer Wohlfahrtsverband mit über 25.000 Einrichtungen',
    source: 'seed',
  },
  {
    company_name: 'NABU - Naturschutzbund Deutschland e.V.',
    website: 'https://www.nabu.de',
    email: 'nabu@nabu.de',
    phone: '+49 30 284984-0',
    address: 'Charitéstraße 3, 10117 Berlin',
    linkedin_url: 'https://linkedin.com/company/nabu',
    industry: 'Umweltschutz',
    tätigkeitsfeld: 'Naturschutz',
    legal_form: 'e.V.',
    status: 'enriched',
    confidence: 0.92,
    tags: ['Umweltschutz', 'Naturschutz', 'NGO'],
    notes: 'Einer der größten deutschen Umweltverbände',
    source: 'seed',
  },
  {
    company_name: 'Deutsches Rotes Kreuz e.V.',
    website: 'https://www.drk.de',
    email: 'drk@drk.de',
    phone: '+49 30 85404-0',
    address: 'Carstennstraße 58, 12205 Berlin',
    linkedin_url: 'https://linkedin.com/company/deutsches-rotes-kreuz',
    industry: 'Rettungsdienst',
    tätigkeitsfeld: 'Katastrophenschutz',
    legal_form: 'e.V.',
    status: 'enriched',
    confidence: 0.98,
    tags: ['Rettungsdienst', 'Katastrophenschutz', 'Humanitäre Hilfe'],
    notes: 'Teil der internationalen Rotkreuz-Bewegung',
    source: 'seed',
  },
  {
    company_name: 'Greenpeace Deutschland',
    website: null,
    email: null,
    phone: null,
    address: null,
    linkedin_url: null,
    industry: null,
    tätigkeitsfeld: null,
    status: 'pending',
    confidence: 0,
    source: 'seed',
  },
  {
    company_name: 'WWF Deutschland',
    website: 'https://www.wwf.de',
    email: 'info@wwf.de',
    phone: '+49 30 311777-0',
    address: 'Reinhardtstraße 18, 10117 Berlin',
    linkedin_url: 'https://linkedin.com/company/wwf-deutschland',
    industry: 'Umweltschutz',
    tätigkeitsfeld: 'Naturschutz',
    legal_form: 'gemeinnützige Stiftung',
    status: 'enriched',
    confidence: 0.89,
    tags: ['Umweltschutz', 'Artenschutz', 'International'],
    notes: 'Internationale Naturschutzorganisation',
    source: 'seed',
  },
]

async function seedLeads() {
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL

  if (!connectionString) {
    console.error('❌ No DATABASE_URL found')
    process.exit(1)
  }

  const pool = new Pool({
    connectionString,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  })

  try {
    console.log('🌱 Seeding sample leads...')

    for (const lead of sampleLeads) {
      const query = `
        INSERT INTO leads (
          company_name, website, email, phone, address, linkedin_url,
          industry, tätigkeitsfeld, legal_form, founded_year, status, confidence,
          tags, notes, source, created_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        ON CONFLICT DO NOTHING
      `

      await pool.query(query, [
        lead.company_name,
        lead.website,
        lead.email,
        lead.phone,
        lead.address,
        lead.linkedin_url,
        lead.industry,
        lead.tätigkeitsfeld,
        lead.legal_form,
        lead.founded_year || null,
        lead.status,
        lead.confidence,
        lead.tags || [],
        lead.notes,
        lead.source,
        'seed_script',
      ])

      console.log(`✅ Inserted: ${lead.company_name}`)
    }

    // Show stats
    const countResult = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'enriched') as enriched,
        COUNT(*) FILTER (WHERE status = 'pending') as pending,
        COUNT(*) FILTER (WHERE status = 'failed') as failed
      FROM leads
      WHERE is_deleted = FALSE
    `)

    const stats = countResult.rows[0]
    console.log('')
    console.log('📊 Database Stats:')
    console.log(`   Total: ${stats.total}`)
    console.log(`   Enriched: ${stats.enriched}`)
    console.log(`   Pending: ${stats.pending}`)
    console.log(`   Failed: ${stats.failed}`)
    console.log('')
    console.log('✨ Seeding complete!')
  } catch (error) {
    console.error('❌ Error seeding leads:', error)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

seedLeads()

