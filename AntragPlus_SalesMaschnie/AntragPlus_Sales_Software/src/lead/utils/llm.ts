import OpenAI from "openai";
import { ENRICHMENT_PROMPT, SIZE_PROMPT } from "../prompts/enrichment";
import { CONFIG } from "../../shared/config-lead";
import type { EnrichmentResult, SizeResult } from "../prompts/enrichment";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

async function callLLMInternal(prompt: string, content: string) {
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
  return await callLLMInternal(ENRICHMENT_PROMPT, orgData);
}

export async function estimateSize(orgData: string): Promise<SizeResult> {
  return await callLLMInternal(SIZE_PROMPT, orgData);
}

/**
 * Generic LLM call for custom enrichment
 */
export async function callLLM(
  prompt: string,
  options?: {
    model?: string;
    temperature?: number;
    max_tokens?: number;
  }
): Promise<string> {
  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) {
    throw new Error('OPENAI_API_KEY not found');
  }

  const openai = new OpenAI({ apiKey: openaiKey });
  
  const res = await openai.chat.completions.create({
    model: options?.model || CONFIG.llm.model,
    temperature: options?.temperature ?? CONFIG.llm.temperature,
    max_tokens: options?.max_tokens,
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
  });

  return res.choices[0].message.content ?? "{}";
}
