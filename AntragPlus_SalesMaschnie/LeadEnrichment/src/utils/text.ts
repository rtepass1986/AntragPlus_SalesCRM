// src/utils/text.ts
import validator from "validator";

export function extractEmails(text: string): string[] {
  const matches = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) || [];
  const cleaned = [...new Set(matches.map((m) => m.trim().toLowerCase()))]
    .filter((e) => validator.isEmail(e))
    .filter((e) => !e.endsWith("@gmail.com") && !e.endsWith("@yahoo.com")); // Orga-Filter
  return cleaned.slice(0, 10);
}

export function extractPhones(text: string): string[] {
  const matches = text.match(/(\+?\d[\d\s()\/-]{6,})/g) || [];
  const cleaned = [...new Set(matches.map((m) => m.replace(/\s+/g, " ").trim()))];
  return cleaned.slice(0, 10);
}

