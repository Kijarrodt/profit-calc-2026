const fs = require("fs");
const path = require("path");

// Ganti dengan domain Cloudflare Pages kamu setelah deploy pertama
const SITE_URL = "https://profit-calc-2026.pages.dev";

const platforms = JSON.parse(fs.readFileSync("platforms.json", "utf8"));
const template = fs.readFileSync("template.html", "utf8");
const outDir = path.join(__dirname, "dist");

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// Generate internal links HTML untuk semua halaman
const internalLinksHtml = platforms
  .map(
    (p) =>
      `<a href="/${p.slug}.html" class="text-slate-400 hover:text-emerald-400 truncate block py-1">${p.h1}</a>`
  )
  .join("\n        ");

const platformsJsonSafe = JSON.stringify(platforms);

function renderPage(item, isHome = false) {
  const canonical = isHome ? `${SITE_URL}/` : `${SITE_URL}/${item.slug}.html`;
  const faqSchema = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: item.faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: f.a,
      },
    })),
  });

  return template
    .replace(/{{TITLE}}/g, isHome ? "Marketplace & Freelance Net Profit Calculator 2026" : item.title)
    .replace(/{{DESC}}/g, item.description)
    .replace(/{{CANONICAL}}/g, canonical)
    .replace(/{{H1}}/g, isHome ? "Marketplace & Freelance Net Profit Calculator (2026)" : item.h1)
    .replace(/{{FAQ_SCHEMA}}/g, faqSchema)
    .replace(/{{INTERNAL_LINKS}}/g, internalLinksHtml)
    .replace(/{{PLATFORMS_JSON}}/g, platformsJsonSafe)
    .replace(/{{PLATFORM_ID}}/g, item.id);
}

// 1. Build halaman utama (index.html)
fs.writeFileSync(path.join(outDir, "index.html"), renderPage(platforms[0], true));

// 2. Build setiap halaman Programmatic SEO
const sitemapUrls = [`  <url><loc>${SITE_URL}/</loc><priority>1.0</priority></url>`];

platforms.forEach((p) => {
  const fileName = `${p.slug}.html`;
  fs.writeFileSync(path.join(outDir, fileName), renderPage(p, false));
  sitemapUrls.push(`  <url><loc>${SITE_URL}/${fileName}</loc><priority>0.8</priority></url>`);
});
fs.copyFileSync("privacy.html", path.join(outDir, "privacy.html"));
sitemapUrls.push(`  <url><loc>${SITE_URL}/privacy.html</loc><priority>0.3</priority></url>`);
// 3. Build sitemap.xml & robots.txt
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapUrls.join("\n")}
</urlset>`;

const robots = `User-agent: *
Allow: /
Sitemap: ${SITE_URL}/sitemap.xml`;

fs.writeFileSync(path.join(outDir, "sitemap.xml"), sitemap);
fs.writeFileSync(path.join(outDir, "robots.txt"), robots);

console.log(`Built ${platforms.length + 1} pages + sitemap.xml successfully.`);
