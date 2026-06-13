// Copies the real bundle.json + types from the fts-data-pipeline repo.
// Usage: npm run sync:data [-- /path/to/fts-data-pipeline]
import { copyFileSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pipeline = process.argv[2] ?? join(process.env.HOME, "Downloads", "fts-data-pipeline");

const bundleSrc = join(pipeline, "out", "bundle.json");
if (!existsSync(bundleSrc)) {
  console.error(`No bundle at ${bundleSrc} — run the pipeline first (npm run build:bundle).`);
  process.exit(1);
}
copyFileSync(bundleSrc, join(root, "public", "bundle.json"));

// Extract only the bundle contract section of the pipeline's types file.
const typesSrc = readFileSync(join(pipeline, "src", "types.ts"), "utf8");
const marker = "/** Final bundle consumed by the FTS web app.";
const idx = typesSrc.indexOf(marker);
if (idx === -1) {
  console.error("Could not find bundle types section in pipeline src/types.ts — copy manually.");
  process.exit(1);
}
const header = `/**\n * Bundle data contract — copied verbatim from fts-data-pipeline/src/types.ts.\n * Do not edit by hand; refresh via \`npm run sync:data\`.\n */\n\n`;
writeFileSync(join(root, "src", "lib", "bundle-types.ts"), header + typesSrc.slice(idx));

const bundle = JSON.parse(readFileSync(bundleSrc, "utf8"));
console.log(`synced bundle v${bundle.version} (${bundle.season}): ${bundle.clubs.length} clubs, ${bundle.players.length} players`);
