import { z } from "zod";

export const Enrichment = z.object({
  summary: z.string(),
  categories: z.array(z.string().min(2)).min(1),
  keywords: z.array(z.string()).max(15),
  outreach_tone: z.enum(["formell_kurz", "partnerschaftlich", "wirkung_orientiert", "technisch"]),
  suggested_hook: z.string(),
  confidence: z.number().optional(),
});

export const SizeEstimate = z.object({
  staff_range: z.enum(["1-5", "6-20", "21-50", "51-200", "200+"]).nullable(),
  budget_range_eur: z.enum(["<100k", "100k-500k", "500k-2M", "2M-10M", ">10M"]).nullable(),
  confidence: z.number(),
  signals: z.array(z.string()).optional(),
});

export const LeadRecord = z.object({
  company_name: z.string(),
  website: z.string().url().nullable(),
  emails: z.array(z.string().email()).default([]),
  phones: z.array(z.string()).default([]),
  enrichment: Enrichment,
  size: SizeEstimate,
  source_signals: z.array(z.string()).default([]),
  source_urls: z.array(z.string()).default([]),
});

export type LeadRecord = z.infer<typeof LeadRecord>;
