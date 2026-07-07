// Generates public/sitemap.xml from the actual app routes, so the sitemap
// can never silently drift out of sync with what App.tsx and calculators.ts
// actually define. Run automatically as part of the frontend build (see
// package.json "prebuild") and can also be run manually:
//   node scripts/generate-sitemap.mjs
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { categories } from "../src/data/calculators.ts";

const SITE_URL = process.env.SITE_URL ?? "https://aimoneyhub.com";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outPath = path.resolve(__dirname, "../public/sitemap.xml");

const staticRoutes = [
  { path: "/", priority: "1.0", changefreq: "daily" },
  { path: "/market", priority: "0.7", changefreq: "daily" },
];

const toolRoutes = categories
  .flatMap((c) => c.tools)
  .map((t) => ({
    path: `/calculator/${t.id}`,
    priority: "0.8",
    changefreq: "weekly",
  }));

const allRoutes = [...staticRoutes, ...toolRoutes];

const today = new Date().toISOString().slice(0, 10);

const urlEntries = allRoutes
  .map(
    (r) => `  <url>
    <loc>${SITE_URL}${r.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority}</priority>
  </url>`,
  )
  .join("\n");

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>
`;

await writeFile(outPath, xml, "utf-8");
console.log(
  `[generate-sitemap] Wrote ${allRoutes.length} URLs to ${outPath}`,
);
