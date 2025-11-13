import fs from "fs";
import "dotenv/config";
import { logger } from "./utils/logger";
import { enrichLead, estimateSize } from "./utils/llm";
import { findWebsiteAndContacts } from "./search";
import { LeadRecord } from "./utils/schemas";
import { CONFIG } from "../config";
import { onceCache, pushReview, pushRunLog } from "./store";

function keyFor(name: string) {
  return name.toLowerCase().normalize("NFKD").replace(/\s+/g, "_");
}

(async () => {
  logger.info("🚀 Lead-Enricher gestartet");
  const csv = fs.readFileSync("src/data/leads.csv", "utf8");
  const names = csv.split("\n").map((l) => l.trim()).filter(Boolean);

  const results: LeadRecord[] = [];
  let lowConfidence = 0;

  for (const name of names.slice(0, CONFIG.batch.maxLeadsPerRun)) {
    const key = `lead:${keyFor(name)}`;
    if (onceCache.has(key)) {
      logger.info({ name }, "⏭️ bereits verarbeitet");
      continue;
    }

    const t0 = Date.now();
    try {
      const core = await findWebsiteAndContacts(name);

      const baseContext = [
        `Organisation: ${name}`,
        core.website ? `Website: ${core.website}` : "Website: unbekannt",
        core.emails.length ? `Emails: ${core.emails.join(", ")}` : "",
        core.phones.length ? `Phones: ${core.phones.join(", ")}` : "",
      ]
        .filter(Boolean)
        .join("\n");

      const enrichment = await enrichLead(baseContext);
      const size = await estimateSize(baseContext);

      const confE = typeof (enrichment as any).confidence === "number" ? (enrichment as any).confidence : 0.7;
      const confS = size.confidence ?? 0.6;

      const record: LeadRecord = {
        company_name: name,
        website: core.website,
        emails: core.emails,
        phones: core.phones,
        enrichment,
        size,
        source_signals: core.signals,
        source_urls: core.source_urls,
      };

      const pass = confE >= CONFIG.confidence.enrichmentMin && confS >= CONFIG.confidence.sizeMin;
      const status = pass ? "created" : "review_needed";
      if (!pass) lowConfidence++;

      results.push(record);
      pushRunLog({ name, status, confE, confS, ms: Date.now() - t0 });

      if (!pass) {
        pushReview({ name, reason: "confidence_below_threshold", confE, confS, record });
        logger.warn({ name, confE, confS }, "🚩 in Review-Queue gelegt");
      } else {
        logger.info({ name, confE, confS }, "✅ Qualitätskriterien erfüllt");
      }

      onceCache.set(key);
    } catch (e: any) {
      logger.error({ name, err: String(e) }, "❌ Verarbeitung fehlgeschlagen");
      pushRunLog({ name, status: "failed", err: String(e) });
    }
  }

  const failRate = results.length ? lowConfidence / results.length : 0;
  if (failRate > 0.15) {
    logger.warn({ failRate }, "⏸️ Auto-Pause wegen zu vieler Low-Confidence Leads");
  }
  logger.info({ total: results.length, lowConfidence }, "🎯 Batch abgeschlossen");
})();
