// src/utils/robots.ts
import { parse, fromUrl } from "robots-txt-parse";

export async function isAllowed(url: string) {
  try {
    const base = new URL(url);
    const robotsUrl = `${base.origin}/robots.txt`;
    const robots = await fromUrl(robotsUrl, { timeout: 8000 });
    const agent = "*";
    return parse(robots.content).isAllowed(url, agent) ?? true;
  } catch {
    return true; // konservativ erlauben, wenn robots nicht erreichbar
  }
}

