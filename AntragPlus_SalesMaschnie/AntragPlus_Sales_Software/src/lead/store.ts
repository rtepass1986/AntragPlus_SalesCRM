// src/store.ts
import fs from "fs";
import path from "path";

const CACHE = path.resolve(".cache.json");
const REV_DIR = path.resolve("src", "reviews");
const RUN_DIR = path.resolve("src", "logs");

if (!fs.existsSync(REV_DIR)) fs.mkdirSync(REV_DIR, { recursive: true });
if (!fs.existsSync(RUN_DIR)) fs.mkdirSync(RUN_DIR, { recursive: true });

const mem = fs.existsSync(CACHE) ? new Set<string>(JSON.parse(fs.readFileSync(CACHE, "utf8"))) : new Set<string>();

export const onceCache = {
  has: (k: string) => mem.has(k),
  set: (k: string) => {
    mem.add(k);
    fs.writeFileSync(CACHE, JSON.stringify([...mem]));
  },
};

export function pushReview(item: any) {
  const f = path.join(REV_DIR, `${new Date().toISOString().slice(0, 10)}.jsonl`);
  fs.appendFileSync(f, JSON.stringify(item) + "\n");
}

export function pushRunLog(item: any) {
  const f = path.join(RUN_DIR, `${new Date().toISOString().replace(/[:.]/g, "_")}.jsonl`);
  fs.appendFileSync(f, JSON.stringify(item) + "\n");
}

