// Downloads the data bundle at build time (runs via `prebuild`).
// Sources, in order: BUNDLE_URL (plain fetch), the Vercel Blob store
// (BLOB_READ_WRITE_TOKEN locally / OIDC + BLOB_STORE_ID on Vercel builds),
// or an existing local public/bundle.json (dev and mock workflows).
import { writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const dest = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "bundle.json");

async function getBundleText() {
  if (process.env.BUNDLE_URL) {
    const headers = process.env.BUNDLE_TOKEN
      ? { authorization: `Bearer ${process.env.BUNDLE_TOKEN}` }
      : {};
    const res = await fetch(process.env.BUNDLE_URL, { headers });
    if (!res.ok) throw new Error(`BUNDLE_URL fetch failed: ${res.status} ${res.statusText}`);
    return res.text();
  }

  const hasBlobAuth =
    process.env.BLOB_READ_WRITE_TOKEN ||
    (process.env.VERCEL_OIDC_TOKEN && process.env.BLOB_STORE_ID);
  if (hasBlobAuth) {
    const { get } = await import("@vercel/blob");
    const result = await get("bundle.json", {
      access: "private",
      token: process.env.BLOB_READ_WRITE_TOKEN || undefined,
    });
    if (!result) throw new Error("bundle.json not found in the Blob store");
    return new Response(result.stream).text();
  }

  return null;
}

const text = await getBundleText();
if (text === null) {
  if (existsSync(dest)) {
    console.log("No bundle source configured — keeping existing public/bundle.json");
    process.exit(0);
  }
  console.error("No bundle source configured and public/bundle.json is missing.");
  console.error("Set BUNDLE_URL or Blob credentials, or run `npm run mock:data` for mock data.");
  process.exit(1);
}

JSON.parse(text); // fail the build on malformed data rather than shipping it
writeFileSync(dest, text);
console.log(`Fetched bundle (${Math.round(text.length / 1024)}k) → public/bundle.json`);
