// Downloads the data bundle at build time (runs via `prebuild`).
// Falls back to an existing local public/bundle.json so dev and mock workflows keep working.
import { writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const dest = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "bundle.json");
const url = process.env.BUNDLE_URL;

if (!url) {
  if (existsSync(dest)) {
    console.log("BUNDLE_URL not set — keeping existing public/bundle.json");
    process.exit(0);
  }
  console.error("BUNDLE_URL is not set and public/bundle.json is missing.");
  console.error("Set BUNDLE_URL (and optional BUNDLE_TOKEN), or run `npm run mock:data` for mock data.");
  process.exit(1);
}

const headers = process.env.BUNDLE_TOKEN
  ? { authorization: `Bearer ${process.env.BUNDLE_TOKEN}` }
  : {};
const res = await fetch(url, { headers });
if (!res.ok) {
  console.error(`Failed to fetch bundle: ${res.status} ${res.statusText}`);
  process.exit(1);
}
const text = await res.text();
JSON.parse(text); // fail the build on malformed data rather than shipping it
writeFileSync(dest, text);
console.log(`Fetched bundle (${Math.round(text.length / 1024)}k) → public/bundle.json`);
