// Uploads public/bundle.json to the Vercel Blob store.
// Needs BLOB_READ_WRITE_TOKEN (kept in .env.local, which node loads via --env-file in the npm script).
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { put } from "@vercel/blob";

const src = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "bundle.json");
const text = readFileSync(src, "utf8");
JSON.parse(text); // never upload malformed data

const blob = await put("bundle.json", text, {
  access: "private",
  allowOverwrite: true,
  contentType: "application/json",
  // explicit token wins over the OIDC token that `vercel env pull` also puts in .env.local
  token: process.env.BLOB_READ_WRITE_TOKEN,
});
console.log(`Uploaded ${Math.round(text.length / 1024)}k → ${blob.pathname} (${blob.url})`);
