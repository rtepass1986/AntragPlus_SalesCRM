export const CONFIG = {
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

export type Config = typeof CONFIG;

