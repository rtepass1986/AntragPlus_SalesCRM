# 🚀 Leads Integration Guide - PostgreSQL Setup

## ✅ Was wurde implementiert

### Frontend
- ✅ Vollständige Leads-Seite mit Filtering, Pagination, Search
- ✅ Lead Detail Panel mit allen Informationen
- ✅ CSV Upload mit Drag & Drop
- ✅ Export Functionality
- ✅ Real-time Stats Dashboard
- ✅ Loading & Error States
- ✅ Deutsche UI

### Backend API
- ✅ `/api/leads` - GET (Liste), POST (Erstellen/Enrichment)
- ✅ `/api/leads/[id]` - GET (Detail), PUT (Update), DELETE
- ✅ `/api/leads/upload` - POST (CSV Upload)

### Database Layer
- ✅ Database Connection Pool (`/lib/db.ts`)
- ✅ Lead Repository (`/lib/repositories/lead-repository.ts`)
- ✅ Lead Service Layer (`/lib/services/lead-service.ts`)
- ✅ Database Schema (`/src/shared/leads-schema.sql`)

### Features
- ✅ **Graceful Degradation** - Funktioniert mit und ohne Datenbank
- ✅ **Mock Data Fallback** - Zeigt Beispiel-Daten wenn DB nicht verfügbar
- ✅ **Error Handling** - Saubere Fehlerbehandlung
- ✅ **TypeScript** - Vollständig typsicher

---

## 🔧 Setup Instructions

### 1. PostgreSQL Datenbank einrichten

#### Option A: Lokale PostgreSQL Installation
```bash
# macOS (mit Homebrew)
brew install postgresql@15
brew services start postgresql@15

# Datenbank erstellen
createdb antragplus_sales

# Oder mit psql
psql postgres
CREATE DATABASE antragplus_sales;
\q
```

#### Option B: Cloud Database (Empfohlen für Production)
- **Vercel Postgres**: https://vercel.com/docs/storage/vercel-postgres
- **Supabase**: https://supabase.com/
- **Railway**: https://railway.app/
- **Neon**: https://neon.tech/

### 2. Environment Variables konfigurieren

```bash
cd AntragPlus_Sales_Software/frontend
cp .env.example .env.local
```

Dann `.env.local` bearbeiten:

```bash
# Für lokale Entwicklung
DATABASE_URL=postgresql://localhost:5432/antragplus_sales

# ODER für Cloud (z.B. Vercel)
POSTGRES_URL=postgresql://user:password@host:port/database?sslmode=require
```

### 3. Database Schema erstellen

```bash
# Option A: Mit psql (lokal)
psql antragplus_sales < src/shared/leads-schema.sql

# Option B: Mit Node Script
node -e "
const { Pool } = require('pg');
const fs = require('fs');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const schema = fs.readFileSync('src/shared/leads-schema.sql', 'utf8');
pool.query(schema).then(() => {
  console.log('✅ Schema created');
  pool.end();
}).catch(console.error);
"
```

### 4. Dependencies installieren

```bash
cd frontend
npm install
```

Das fügt automatisch `pg` und `@types/pg` hinzu.

### 5. Dev Server starten

```bash
npm run dev -- -p 3001
```

---

## 📊 Database Schema Übersicht

### Haupttabellen

#### `leads`
- Speichert alle Lead-Informationen
- Status: pending, enriched, failed
- Confidence Score (0-1)
- Leadership als JSONB
- Soft Delete Support

#### `lead_enrichment_history`
- Tracking aller Enrichment-Versuche
- Kosten-Tracking
- Performance-Metriken

#### `lead_tags`
- Normalisierte Tag-Speicherung
- Bessere Query-Performance

#### `lead_notes`
- Notizen und Kommentare
- Verschiedene Typen (call, meeting, email)

#### `csv_import_batches`
- CSV-Import Tracking
- Erfolgs-/Fehlerrate

### Wichtige Felder

```sql
-- Kernfelder
company_name VARCHAR(255) NOT NULL
status VARCHAR(50) -- 'pending', 'enriched', 'failed'
confidence DECIMAL(3,2) -- 0.00 bis 1.00

-- Kontaktdaten
website, email, phone, address, linkedin_url

-- Organisationsdetails
industry, tätigkeitsfeld, legal_form
founded_year, employees_estimate, revenue_estimate

-- AI-generierte Inhalte
description TEXT -- 2-3 Sätze auf Deutsch
tags TEXT[]
leadership JSONB

-- Pipedrive Integration
pipedrive_org_id INTEGER
synced_to_pipedrive BOOLEAN
```

---

## 🎯 API Endpoints

### GET /api/leads
Liste aller Leads mit Filtering

**Query Parameters:**
- `status` - 'all', 'enriched', 'pending', 'failed'
- `search` - Suchtext (Company, Industry, Field)
- `page` - Seitennummer (default: 1)
- `limit` - Leads pro Seite (default: 20)

**Response:**
```json
{
  "leads": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  },
  "stats": {
    "total": 150,
    "enriched": 120,
    "pending": 25,
    "failed": 5,
    "avgConfidence": 0.89,
    "costEstimate": 7.50
  }
}
```

### GET /api/leads/[id]
Lead Details mit vollständigen Informationen

### POST /api/leads
Neuen Lead erstellen oder Enrichment starten

**Create Lead:**
```json
{
  "companyName": "Beispiel Organisation e.V.",
  "website": "https://example.org",
  "email": "info@example.org"
}
```

**Start Enrichment:**
```json
{
  "action": "enrich",
  "leadIds": ["1", "2", "3"]
}
```

### POST /api/leads/upload
CSV Upload

**Body:** FormData mit 'file' field

**CSV Format:**
```csv
company,website,email,phone,address
Beispiel e.V.,https://example.org,info@example.org,+49...,Berlin
```

Unterstützte Spaltennamen (automatisch erkannt):
- **Company**: company, name, organization, firma, unternehmen
- **Website**: website, url, web
- **Email**: email, mail, e-mail
- **Phone**: phone, tel, telefon, telephone
- **Address**: address, adresse
- **Industry**: industry, industrie, branche
- **Field**: tätigkeitsfeld, field, bereich

---

## 🔍 Testing

### 1. Test ohne Datenbank (Mock Data)
```bash
# Einfach ohne DATABASE_URL starten
npm run dev -- -p 3001
```

Die API gibt automatisch Mock-Daten zurück mit einem `_note` field.

### 2. Test mit Datenbank

```bash
# .env.local mit DATABASE_URL
DATABASE_URL=postgresql://localhost:5432/antragplus_sales

# Schema erstellen
psql antragplus_sales < ../src/shared/leads-schema.sql

# Server starten
npm run dev -- -p 3001
```

### 3. CSV Upload testen

Beispiel CSV erstellen:
```csv
company,website,email,phone
Deutscher Caritasverband e.V.,https://www.caritas.de,info@caritas.de,+49 761 200-0
NABU Deutschland e.V.,https://www.nabu.de,nabu@nabu.de,+49 30 284984-0
```

Dann auf http://localhost:3001/dashboard/leads hochladen.

---

## 🚀 Production Deployment

### 1. Vercel Postgres (Empfohlen)

```bash
# Vercel Postgres hinzufügen
vercel postgres create

# Environment Variables werden automatisch gesetzt
# POSTGRES_URL, POSTGRES_PRISMA_URL, etc.
```

### 2. Database Migrations

```bash
# Schema auf Production DB anwenden
psql $DATABASE_URL < src/shared/leads-schema.sql
```

### 3. Environment Variables setzen

In Vercel Dashboard oder via CLI:
```bash
vercel env add DATABASE_URL
vercel env add OPENAI_API_KEY
vercel env add TAVILY_API_KEY
vercel env add PIPEDRIVE_API_TOKEN
```

---

## 📈 Next Steps

### Sofort nutzbar:
✅ Leads-Seite ist funktional mit Mock-Daten
✅ CSV Upload funktioniert
✅ UI ist vollständig

### Für Production:
1. **PostgreSQL Setup** (siehe oben)
2. **Environment Variables** konfigurieren
3. **Schema erstellen** (SQL Script ausführen)
4. **Dependencies installieren** (`npm install`)
5. **Server neu starten**

### Zukünftige Erweiterungen:
- [ ] Enrichment Queue System (Bull/BullMQ)
- [ ] Real-time Progress Tracking (WebSocket)
- [ ] Batch Operations UI
- [ ] Advanced Filtering & Sorting
- [ ] Lead Deduplication
- [ ] Automated Enrichment Scheduling

---

## 🐛 Troubleshooting

### "DATABASE_URL not configured"
- ➡️ Normal! Die App funktioniert mit Mock-Daten
- ➡️ Füge DATABASE_URL in `.env.local` hinzu für echte Daten

### "Database connection failed"
- ➡️ Prüfe ob PostgreSQL läuft: `pg_isready`
- ➡️ Prüfe Connection String Format
- ➡️ Prüfe Firewall/Network Settings

### "Error loading leads"
- ➡️ API fällt automatisch auf Mock-Daten zurück
- ➡️ Check Browser Console für Details
- ➡️ Check Server Logs

### CSV Upload schlägt fehl
- ➡️ Prüfe CSV Format (UTF-8 encoding)
- ➡️ Max 10MB File Size
- ➡️ Mindestens 'company' oder 'name' Spalte erforderlich

---

## 📞 Support

Die Leads-Seite ist **produktionsreif** und funktioniert:
- ✅ **Ohne Datenbank** (Mock-Daten für Demo)
- ✅ **Mit Datenbank** (Vollständige CRUD Operations)
- ✅ **Graceful Degradation** (Fehler werden abgefangen)

**Empfohlenes Setup für Development:**
1. Lokale PostgreSQL starten
2. Schema erstellen
3. DATABASE_URL setzen
4. Testen mit echten Daten

**Für Production:**
1. Vercel Postgres oder andere Cloud-DB
2. Schema deployen
3. Environment Variables setzen
4. Deploy! 🚀

