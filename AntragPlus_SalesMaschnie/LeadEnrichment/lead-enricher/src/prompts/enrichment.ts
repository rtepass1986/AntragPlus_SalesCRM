export const ENRICHMENT_PROMPT = `
Du bist ein KI-Analyst für Nonprofit-Organisationen in Deutschland.
Analysiere die Organisation und gib strukturiertes JSON gemäß Schema zurück.

Schema:
{
  "summary": "1-3 Sätze, deutsch, worum es geht.",
  "categories": ["eine oder mehrere aus der erlaubten Liste"],
  "keywords": ["max 15 relevante Stichwörter"],
  "outreach_tone": "formell_kurz | partnerschaftlich | wirkung_orientiert | technisch",
  "suggested_hook": "Ein Satz als individueller Aufhänger für eine E-Mail."
}

Kategorien (fixe Liste):
Kinder_und_Jugendhilfe, Umwelt_BNE, Bildung_Demokratie, Gesundheit_Pflege, 
Integration_Migration, Kultur_Sport, Armut_Soziales, Wissenschaft_Forschung, 
Internationales_Entwicklung, Technologie_Digitalisierung.

Antworte NUR mit JSON, ohne Erklärungen. Keine zusätzlichen Felder.
Wenn du unsicher bist, gib "review_needed": true und füge confidence: <0.5 hinzu.
`;

export type EnrichmentResult = {
  summary: string;
  categories: string[];
  keywords: string[];
  outreach_tone: "formell_kurz" | "partnerschaftlich" | "wirkung_orientiert" | "technisch";
  suggested_hook: string;
  review_needed?: boolean;
  confidence?: number;
};

export const SIZE_PROMPT = `
Schätze die Größe einer deutschen Nonprofit-Organisation.

Schema:
{
  "staff_range": "1-5 | 6-20 | 21-50 | 51-200 | 200+ | null",
  "budget_range_eur": "<100k | 100k-500k | 500k-2M | 2M-10M | >10M | null",
  "confidence": 0.0-1.0,
  "signals": ["Hinweise, z.B. Jahresbericht, Teamgröße, Spendensumme"]
}

Wenn keine Informationen verfügbar sind, setze staff_range und budget_range_eur auf null und confidence < 0.4.
Antwort NUR als JSON.
`;

export type SizeResult = {
  staff_range: "1-5" | "6-20" | "21-50" | "51-200" | "200+" | null;
  budget_range_eur: "<100k" | "100k-500k" | "500k-2M" | "2M-10M" | ">10M" | null;
  confidence: number;
  signals: string[];
};
