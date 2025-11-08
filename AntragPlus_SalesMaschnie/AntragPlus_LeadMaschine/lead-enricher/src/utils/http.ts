// src/utils/http.ts
import axios, { AxiosInstance } from "axios";
import PQueue from "p-queue";
import { logger } from "./logger";

export const http: AxiosInstance = axios.create({
  timeout: 15000,
  headers: { "User-Agent": "LeadEnricher/1.0 (+contact: outreach@yourdomain.tld)" },
  maxRedirects: 3,
});

export const queue = new PQueue({
  concurrency: 3, // Qualität > Speed
  intervalCap: 50,
  interval: 60 * 1000,
});

export async function queuedGet(url: string) {
  return queue.add(async () => {
    for (let i = 0; i < 3; i++) {
      try {
        const res = await http.get(url);
        return res.data as string;
      } catch (e: any) {
        const status = e?.response?.status;
        if (status === 429 || status >= 500) {
          const backoff = Math.min(2000 * Math.pow(2, i), 10000);
          logger.warn({ url, status, backoff }, "Retry wegen 429/5xx");
          await new Promise((r) => setTimeout(r, backoff));
          continue;
        }
        logger.warn({ url, status }, "GET fehlgeschlagen");
        throw e;
      }
    }
    throw new Error(`Retries exhausted for ${url}`);
  });
}

