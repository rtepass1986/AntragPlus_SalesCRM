// src/search.ts
import { queuedGet } from "./utils/http";
import * as cheerio from "cheerio";
import { parse as parseTld } from "tldts";
import { extractEmails, extractPhones } from "./utils/text";
import { logger } from "./utils/logger";
import { isAllowed } from "./utils/robots";
import { chromium } from "playwright";

type Core = {
  company_name: string;
  website: string | null;
  emails: string[];
  phones: string[];
  address: string | null;
  signals: string[];
  source_urls: string[];
};

export async function findWebsiteAndContacts(name: string, seed?: string): Promise<Core> {
  const signals: string[] = [];
  const source_urls: string[] = [];

  const website = seed ?? (await searchDomain(name));
  if (!website) {
    return { company_name: name, website: null, emails: [], phones: [], address: null, signals: ["no_website"], source_urls };
  }

  const pages = unique([
    website,
    website + "/impressum",
    website + "/kontakt",
    website + "/contact",
    website + "/ueber-uns",
  ]);

  const emails = new Set<string>();
  const phones = new Set<string>();
  let address: string | null = null;

  for (const url of pages) {
    try {
      if (!(await isAllowed(url))) {
        signals.push("robots_blocked");
        continue;
      }

      let html: string | null = null;
      try {
        html = await queuedGet(url);
      } catch {
        // Fallback auf Render, falls JS-Seite
        html = await renderPage(url);
        if (html) signals.push("rendered_js_page");
      }
      if (!html) continue;

      source_urls.push(url);
      const $ = cheerio.load(html);
      const text = $("body").text();

      extractEmails(text).forEach((e) => emails.add(e));
      extractPhones(text).forEach((p) => phones.add(p));

      if (/Impressum|Verein|gGmbH|Stiftung|gUG/i.test(text)) signals.push("legal_form_hint");
      if (/Jahresbericht|Transparenz|Haushalt/i.test(text)) signals.push("reporting_hint");

      // grobe Adressheuristik
      const addrMatch = text.match(/\b(\d{4,5}\s+[A-ZÄÖÜa-zäöüß\.\- ]+)\b/);
      if (addrMatch && !address) address = addrMatch[0].trim();
    } catch (e) {
      logger.warn({ url, err: String(e) }, "Seite konnte nicht verarbeitet werden");
    }
  }

  return {
    company_name: name,
    website,
    emails: [...emails],
    phones: [...phones],
    address,
    signals: signals.length ? [...new Set(signals)] : [],
    source_urls,
  };
}

async function searchDomain(query: string): Promise<string | null> {
  // Stub: Ersetze hier mit Tavily/SerpAPI. Bis dahin naive heuristische Suche:
  // Vorsicht: Ohne echte Websuche ist das leer. Absichtlich konservativ.
  return null;
}

function normalizeUrl(url: string) {
  try {
    const u = new URL(url);
    const t = parseTld(u.hostname);
    const apex = t.domain ? `${t.domain}.${t.publicSuffix}` : u.hostname;
    return `https://${apex}`;
  } catch {
    return null;
  }
}

function unique<T>(arr: T[]) {
  return [...new Set(arr)];
}

async function renderPage(url: string): Promise<string | null> {
  try {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ userAgent: "LeadEnricher/1.0" });
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 });
    const html = await page.content();
    await browser.close();
    return html;
  } catch {
    return null;
  }
}

