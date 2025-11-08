export interface EnvironmentConfig {
  PIPEDRIVE_API_TOKEN: string;
  ASANA_CLIENT_ID: string;
  ASANA_CLIENT_SECRET: string;
  ASANA_ACCESS_TOKEN: string;
  ASANA_WORKSPACE_ID: string;
  DATABASE_URL: string;
  WEBHOOK_SECRET: string;
  STAGE: string;
  NODE_ENV: string;
}

export const getEnvConfig = (): EnvironmentConfig => {
  const requiredEnvVars = [
    'PIPEDRIVE_API_TOKEN',
    'ASANA_CLIENT_ID',
    'ASANA_CLIENT_SECRET',
    'ASANA_ACCESS_TOKEN',
    'ASANA_WORKSPACE_ID',
    'DATABASE_URL',
    'WEBHOOK_SECRET'
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }

  return {
    PIPEDRIVE_API_TOKEN: process.env.PIPEDRIVE_API_TOKEN!,
    ASANA_CLIENT_ID: process.env.ASANA_CLIENT_ID!,
    ASANA_CLIENT_SECRET: process.env.ASANA_CLIENT_SECRET!,
    ASANA_ACCESS_TOKEN: process.env.ASANA_ACCESS_TOKEN!,
    ASANA_WORKSPACE_ID: process.env.ASANA_WORKSPACE_ID!,
    DATABASE_URL: process.env.DATABASE_URL!,
    WEBHOOK_SECRET: process.env.WEBHOOK_SECRET!,
    STAGE: process.env.STAGE || 'dev',
    NODE_ENV: process.env.NODE_ENV || 'development'
  };
};

export const config = getEnvConfig();
