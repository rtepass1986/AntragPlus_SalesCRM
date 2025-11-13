import OpenAI from "openai";
import { ENRICHMENT_PROMPT, SIZE_PROMPT } from "../prompts/enrichment";
import { CONFIG } from "../../config";
import type { EnrichmentResult, SizeResult } from "../prompts/enrichment";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

async function callLLM(prompt: string, content: string) {
  const res = await client.chat.completions.create({
    model: CONFIG.llm.model,
    temperature: CONFIG.llm.temperature,
    messages: [
      { role: "system", content: prompt },
      { role: "user", content },
    ],
    response_format: { type: "json_object" },
  });
  return JSON.parse(res.choices[0].message.content ?? "{}");
}

export async function enrichLead(orgData: string): Promise<EnrichmentResult> {
  return await callLLM(ENRICHMENT_PROMPT, orgData);
}

export async function estimateSize(orgData: string): Promise<SizeResult> {
  return await callLLM(SIZE_PROMPT, orgData);
}
