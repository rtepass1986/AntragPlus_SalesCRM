import { enrichLead, estimateSize } from "./utils/llm";
import { logger } from "./utils/logger";
import { LeadRecord } from "./utils/schemas";
import fs from "fs";
import "dotenv/config";

(async () => {
  logger.info("🚀 Lead-Enricher gestartet");

  const input = fs.readFileSync("src/data/leads.csv", "utf8");
  const orgs = input.split("\n").filter(Boolean).map((l) => l.trim());

  for (const name of orgs) {
    logger.info(`🔎 Analysiere: ${name}`);
    const base = `Organisation: ${name}`;
    const enrichment = await enrichLead(base);
    const size = await estimateSize(base);

    const record: LeadRecord = {
      company_name: name,
      website: null,
      emails: [],
      phones: [],
      enrichment,
      size,
    };

    logger.info({ record }, "✅ Ergebnis gespeichert");
  }

  logger.info("🎯 Batch abgeschlossen");
})();
