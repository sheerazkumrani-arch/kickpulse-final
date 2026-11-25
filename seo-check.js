// Pitchside Notes SEO check. build.js runs this automatically at the end of every build.
// It reads the finished pages in dist/ and reports problems in plain words.
//   errors = serious (missing title/description/canonical, wrong canonical, noindex by mistake, article without author/date)
//   warn   = should be fixed (broken internal links, page missing from the sitemap, duplicate titles/descriptions, missing image sizes)
// The site still builds. If you want the build to STOP on errors, add the setting SEO_STRICT = 1 in Vercel
// (Project > Settings > Environment Variables). You can also run it alone after a build:  node seo-check.js
const fs = require("fs"), path = require("path");

module.exports = function check(OUT, SITE) {
  const errors = [], warn = [], pages = {};
  const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : e.name === "index.html" ? [path.join(d, e.name)] : []));
  for (const f of walk(OUT)) { let u = "/" + path.relative(OUT, path.dirname(f)).split(path.sep).join("/") + "/"; if (u === "//") u = "/"; pages[u] = fs.readFileSync(f, "utf8"); }
  const sm = fs.existsSync(path.join(OUT, "sitemap.xml")) ? fs.readFileSync(path.join(OUT, "sitemap.xml"), "utf8") : "";
  if (!sm) errors.push("sitemap.xml was not created.");
  const inSm = new Set([...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].replace(SITE, "")));
  const robots = fs.existsSync(path.join(OUT, "robots.txt")) ? fs.readFileSync(path.join(OUT, "robots.txt"), "utf8") : "";
  if (!/Sitemap:\s*https:\/\//i.test(robots)) errors.push("robots.txt does not point to the sitemap.");
  if (/^\s*Disallow:\s*\/\s*$/im.test(robots)) errors.push("robots.txt blocks the whole site (Disallow: /).");
  const titles = {}, descs = {}, files = new Set();
  const walkAll = (d) => fs.readdirSync(d, { withFileTypes: true }).forEach((e) => (e.isDirectory() ? walkAll(path.join(d, e.name)) : files.add("/" + path.relative(OUT, path.join(d, e.name)).split(path.sep).join("/"))));
  walkAll(OUT);
  const gone = new Set();
  for (const [u, h] of Object.entries(pages)) {
    const t = (h.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || "", d = (h.match(/<meta name="description" content="([^"]*)"/) || [])[1] || "";
    const can = [...h.matchAll(/<link rel="canonical" href="([^"]+)"/g)].map((m) => m[1]);
    if (!t.trim()) errors.push(`${u}: no <title>.`);
    if (!d.trim()) errors.push(`${u}: no meta description.`);
    else if (d.length > 165) warn.push(`${u}: description is ${d.length} characters (aim for 120-155).`);
    if (can.length !== 1) errors.push(`${u}: ${can.length} canonical tags (must be exactly 1).`);
    else if (can[0] !== SITE + u) errors.push(`${u}: canonical points to ${can[0]} instead of itself.`);
    if (/<meta[^>]+name="robots"[^>]+noindex/i.test(h)) errors.push(`${u}: has noindex, so Google will not index it.`);
    if ((h.match(/<h1[\s>]/g) || []).length !== 1) warn.push(`${u}: should have exactly one <h1>.`);
    if (!inSm.has(u)) warn.push(`${u}: is not in sitemap.xml.`);
    (titles[t] = titles[t] || []).push(u); (descs[d] = descs[d] || []).push(u);
    if (u.startsWith("/articles/") && u !== "/articles/") {
      if (!/"datePublished"/.test(h)) errors.push(`${u}: article has no publish date (add "date:" to the top block).`);
      if (!/"author":\{"@type":"Person"/.test(h)) errors.push(`${u}: article has no author.`);
    }
    // SEO UPDATE 2: extra checks in simple words
    if (u !== "/" && t.length > 65) warn.push(`${u}: title is ${t.length} characters. Google shows about 60. Add a shorter  seo_title:  line.`);
    for (const img of h.match(/<img\b[^>]*>/g) || []) if (!/\balt="[^"]+"/.test(img)) warn.push(`${u}: a picture has no alt text (a short description for blind readers and Google): ${(img.match(/src="([^"]+)"/) || [])[1]}`);
    for (const m of h.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) { try { JSON.parse(m[1]); } catch (e) { errors.push(`${u}: the schema code (JSON-LD) is broken, so Google cannot read it.`); } }
    if (u.startsWith("/articles/") && u !== "/articles/") { const words = h.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, "").replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length; if (words < 600) warn.push(`${u}: only about ${words} words. Short pages are often "Crawled - currently not indexed". Add your own analysis.`); }
    for (const img of h.match(/<img\b[^>]*>/g) || []) if (!/\bwidth=/.test(img)) warn.push(`${u}: a picture has no width/height: ${(img.match(/src="([^"]+)"/) || [])[1]}`);
    for (const m of h.matchAll(/href="(\/[^"#?]*)"/g)) {
      const l = m[1]; if (l.startsWith("/_vercel/")) continue;
      const ok = /\.[a-z0-9]{2,5}$/i.test(l) ? files.has(decodeURI(l)) : pages[l] !== undefined;
      if (!ok && !gone.has(u + l)) { gone.add(u + l); warn.push(`${u}: broken internal link ${l}`); }
    }
  }
  for (const [t, l] of Object.entries(titles)) if (l.length > 1) warn.push(`Same <title> on ${l.length} pages: ${l.join(", ")}`);
  for (const [d, l] of Object.entries(descs)) if (d && l.length > 1) warn.push(`Same description on ${l.length} pages: ${l.join(", ")}`);
  if (!files.has("/llms.txt")) warn.push("llms.txt was not created.");
  if (!files.has("/404.html")) errors.push("404.html was not created, so wrong addresses show Vercel's plain error page.");
  for (const u of inSm) if (pages[u] === undefined) warn.push(`sitemap.xml lists ${u}, but that page does not exist.`);
  return { errors, warn, count: Object.keys(pages).length };
};

if (require.main === module) {
  const OUT = path.join(__dirname, "dist"), SITE = "https://kickpulse-final.vercel.app";
  const r = module.exports(OUT, SITE);
  console.log(`Checked ${r.count} pages.`);
  r.errors.forEach((e) => console.log(" ! " + e)); r.warn.forEach((w) => console.log(" - " + w));
  if (!r.errors.length && !r.warn.length) console.log("No SEO problems found.");
  process.exitCode = r.errors.length ? 1 : 0;
}
