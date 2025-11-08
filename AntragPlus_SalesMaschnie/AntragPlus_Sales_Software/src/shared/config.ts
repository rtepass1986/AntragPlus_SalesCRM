/**
 * Unified Configuration for AntragPlus Sales Software
 * Combines settings from Lead Enricher and Sync Engine
 */

// ===================================
// LEAD ENRICHMENT CONFIGURATION
// ===================================
export const LEAD_CONFIG = {
  batch: {
    maxLeadsPerRun: 80,
    monthlyLimit: 1500,
    costCapEur: 60,
  },
  confidence: {
    enrichmentMin: 0.7,
    sizeMin: 0.6,
  },
  categories: [
    "Kinder_und_Jugendhilfe",
    "Umwelt_BNE",
    "Bildung_Demokratie",
    "Gesundheit_Pflege",
    "Integration_Migration",
    "Kultur_Sport",
    "Armut_Soziales",
    "Wissenschaft_Forschung",
    "Internationales_Entwicklung",
    "Technologie_Digitalisierung",
  ],
  storage: {
    rawDataRetentionDays: 60,
  },
  llm: {
    model: "gpt-4o-mini",
    temperature: 0.2,
    tokenLimit: 4000,
  },
} as const;

// ===================================
// SYNC ENGINE CONFIGURATION
// ===================================
export const SYNC_CONFIG = {
  interval: '5 minutes',
  timeout: 300,
  stages: [16, 18, 9, 22, 10, 13, 15, 11, 12], // Stages to sync
  retryAttempts: 3,
  retryDelay: 1000,
} as const;

// ===================================
// AUTOMATION CONFIGURATION
// ===================================
export const AUTOMATION_CONFIG = {
  timerAutoStart: true,
  timerAutoStop: true,
  autoAssignment: true,
  emailGeneration: true,
} as const;

// ===================================
// ENVIRONMENT CONFIGURATION
// ===================================
export interface EnvironmentConfig {
  // Pipedrive
  PIPEDRIVE_API_TOKEN: string;
  
  // Asana
  ASANA_CLIENT_ID: string;
  ASANA_CLIENT_SECRET: string;
  ASANA_ACCESS_TOKEN: string;
  ASANA_WORKSPACE_ID: string;
  
  // Database
  DATABASE_URL: string;
  
  // OpenAI
  OPENAI_API_KEY: string;
  
  // Optional
  TAVILY_API_KEY?: string;
  WEBHOOK_SECRET?: string;
  
  // Application
  NODE_ENV: string;
  STAGE: string;
}

export function getEnvConfig(): EnvironmentConfig {
  const requiredEnvVars = [
    'PIPEDRIVE_API_TOKEN',
    'ASANA_CLIENT_ID',
    'ASANA_CLIENT_SECRET',
    'ASANA_ACCESS_TOKEN',
    'ASANA_WORKSPACE_ID',
    'DATABASE_URL',
    'OPENAI_API_KEY',
  ];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      throw new Error(`Missing required environment variable: ${envVar}`);
    }
  }

  return {
    PIPEDRIVE_API_TOKEN: process.env.PIPEDRIVE_API_TOKEN!,
    ASANA_CLIENT_ID: process.env.ASANA_CLIENT_ID!,
    ASANA_CLIENT_SECRET: process.env.ASANA_CLIENT_SECRET!,
    ASANA_ACCESS_TOKEN: process.env.ASANA_ACCESS_TOKEN!,
    ASANA_WORKSPACE_ID: process.env.ASANA_WORKSPACE_ID!,
    DATABASE_URL: process.env.DATABASE_URL!,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY!,
    TAVILY_API_KEY: process.env.TAVILY_API_KEY,
    WEBHOOK_SECRET: process.env.WEBHOOK_SECRET,
    NODE_ENV: process.env.NODE_ENV || 'development',
    STAGE: process.env.STAGE || 'dev',
  };
}

// Export types
export type LeadConfig = typeof LEAD_CONFIG;
export type SyncConfig = typeof SYNC_CONFIG;
export type AutomationConfig = typeof AUTOMATION_CONFIG;

// Export singleton config instance
export const config = getEnvConfig();

