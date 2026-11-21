// Pitchside Notes site builder.
// Reads content/*.md and writes the finished website into dist/. Vercel runs this automatically (see vercel.json).
// You normally never edit this file. Site name and address are the three lines under "SETTINGS".
const fs = require("fs"), path = require("path");
const ROOT = __dirname, OUT = path.join(ROOT, "dist"), STATIC = path.join(ROOT, "static"), warn = [];

// ---------- SETTINGS ----------
const SITE = "https://kickpulse-final.vercel.app";          // your site address (no slash at the end)
const NAME = "Pitchside Notes";
const AUTHOR = "Sheeraz Khan"; // shown on every article as the author (the page shows it in capitals). Empty "" = use each article's own author line.
const KP = "https://kickpulse-football.vercel.app";          // your KickPulse scores site
const KPL = [["/mls-live-scores/", "MLS live scores today"], ["/mls-schedule/", "MLS schedule"], ["/mls-on-tv/", "MLS on TV"], ["/mls-playoffs/", "MLS playoffs matches today"], ["/inter-miami-live-score/", "Inter Miami live score"]];
// Home page: moving green strip and the numbers row. Edit the words freely.
const TICKER = ["MLS previews", "Team news", "Predicted lineups", "Match analysis", "Live scores"];
const STATS = () => [[String(arts.length), "Match articles"], [String(cats.length), "Topics covered"], ["100%", "Free to read"]]; // 3rd one is plain text: change it if you like
const kpLinks = () => KPL.map((l) => `<a href="${KP}${l[0]}" rel="noopener">${l[1]}</a>`).join("");
// Search Console "HTML tag" code: put ONLY the content value in the file verify.txt (see README). Nothing to edit here.
const readTxt = (f) => { try { return fs.readFileSync(path.join(ROOT, f), "utf8").trim(); } catch (e) { return ""; } };
const VERIFY = readTxt("verify.txt");

// ---------- helpers ----------
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const slug = (s) => String(s).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const UI = { fr: { toc: "Dans cet article", min: "min de lecture", loc: "fr-FR", ctaT: "Suivre le match en direct", cta: (a, b) => `Ouvrez <a href="${a}" rel="noopener">KickPulse</a> pour les scores en direct, ou consultez le <a href="${b}" rel="noopener">programme MLS</a>.`, more: "À lire aussi", name: "Français", sw: "Lire cet article en français" } };
const fmt = (d, loc) => { const dm = String(d).match(/^(\d{4}-\d{2}-\d{2})/), x = new Date((dm ? dm[1] : d) + "T00:00:00Z"); return isNaN(x) ? d : x.toLocaleDateString(loc || "en-GB", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" }); };
const isUrl = (u) => /^https?:\/\//.test(u);
const normImg = (u) => (isUrl(u) || u.startsWith("/") ? u : "/" + u);
function imgState(src) { // "ok" | "missing" | "case"
  if (isUrl(src)) return "ok";
  const parts = src.split("/").filter(Boolean); let dir = STATIC;
  for (const p of parts) {
    let names = []; try { names = fs.readdirSync(dir); } catch (e) { return "missing"; }
    if (names.includes(p)) { dir = path.join(dir, p); continue; }
    return names.some((n) => n.toLowerCase() === p.toLowerCase()) ? "case" : "missing";
  }
  return "ok";
}
function checkImg(src, file, alt) {
  const s = imgState(src);
  if (s === "missing") warn.push(`${file}: image "${src}" not found. Put the file in static/images/ and check the name.`);
  if (s === "case") warn.push(`${file}: image "${src}" has different capital/small letters than the real file. It works on Windows but BREAKS on Vercel. Make the names identical.`);
  if (alt !== undefined && !String(alt).trim()) warn.push(`${file}: image "${src}" has no description (alt text). Write one inside the [ ].`);
  return s === "ok";
}
const inl = (s) => esc(s)
  .replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (m, a, u) => (imgState(normImg(u)) === "ok" ? `<img src="${normImg(u)}" alt="${a}" loading="lazy">` : ""))
  .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, t, u) => `<a href="${u}"${isUrl(u) && !u.startsWith(SITE) ? ' rel="noopener"' : ""}>${t}</a>`)
  .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
  .replace(/(^|[\s(])\*([^*\s][^*]*?)\*(?=[\s).,;:!?]|$)/g, "$1<em>$2</em>");

function md(t, file, title) {
  const L = t.split(/\r?\n/), toc = [], used = {}; let o = "", i = 0, p = [], first = null;
  const flush = () => { if (p.length) { o += "<p>" + inl(p.join(" ")) + "</p>"; p = []; } };
  const take = (re) => { const r = []; while (i < L.length && re.test(L[i])) r.push(L[i++]); return r; };
  while (i < L.length) {
    const l = L[i]; let m;
    if (!l.trim()) { flush(); i++; continue; }
    if ((m = l.match(/^!\[([^\]]*)\]\(\s*([^)\s]+)(?:\s+"([^"]*)")?\s*\)\s*$/))) {
      flush(); const src = normImg(m[2]), good = checkImg(src, file, m[1]); i++;
      if (!good) continue; // a missing picture is left out, so no broken-image box appears on the page
      const fig = `<figure><img src="${esc(src)}" alt="${esc(m[1])}" loading="lazy">${m[3] ? "<figcaption>" + inl(m[3]) + "</figcaption>" : ""}</figure>`;
      if (!first) first = { html: fig, src, alt: m[1] };
      o += fig; continue;
    }
    if (/^# /.test(l)) { flush(); if (l.slice(2).trim().toLowerCase() !== String(title || "").trim().toLowerCase()) warn.push(`${file}: the line "${l.slice(0, 50)}" was skipped. Use ## for headings. The title comes from "title:" at the top.`); i++; continue; }
    if ((m = l.match(/^-{3,}(!\[.*)$/))) { flush(); o += "<hr>"; L[i] = m[1]; continue; }
    if ((m = l.match(/^(##|###) (.+)$/))) {
      flush(); const n = m[1].length, base = slug(m[2]) || "section"; let id = base, k = 2; while (used[id]) id = base + "-" + k++; used[id] = 1;
      if (n === 2) toc.push({ id, text: m[2] });
      o += `<h${n} id="${id}">${inl(m[2])}</h${n}>`; i++; continue;
    }
    if (/^(-{3,}|\*{3,})\s*$/.test(l)) { flush(); o += "<hr>"; i++; continue; }
    if (/^[-*] /.test(l)) { flush(); o += "<ul>" + take(/^[-*] /).map((x) => "<li>" + inl(x.slice(2)) + "</li>").join("") + "</ul>"; continue; }
    if (/^\d+\. /.test(l)) { flush(); o += "<ol>" + take(/^\d+\. /).map((x) => "<li>" + inl(x.replace(/^\d+\. /, "")) + "</li>").join("") + "</ol>"; continue; }
    if (/^>/.test(l)) { flush(); o += "<blockquote><p>" + inl(take(/^>/).map((x) => x.replace(/^>\s?/, "")).join(" ").trim()) + "</p></blockquote>"; continue; }
    if (/^\|.*\|\s*$/.test(l)) {
      flush(); const rows = take(/^\|.*\|\s*$/).map((r) => r.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim()));
      const sep = rows.length > 1 && rows[1].every((c) => /^:?-+:?$/.test(c)), body = sep ? rows.slice(2) : rows;
      o += `<div class="tw"><table>${sep ? "<thead><tr>" + rows[0].map((c) => "<th>" + inl(c) + "</th>").join("") + "</tr></thead>" : ""}<tbody>${body.map((r) => "<tr>" + r.map((c) => "<td>" + inl(c) + "</td>").join("") + "</tr>").join("")}</tbody></table></div>`; continue;
    }
    if (/^[*_\s]*By\s.+\bLast updated\b/i.test(l)) { flush(); i++; continue; } // extra byline line from older MD files: the real author and date are shown by the page itself
    p.push(l.trim()); i++;
  }
  flush(); return { html: o, toc, first };
}

function placeImgs(html, imgs, meta) {
  if (!imgs.length) return html;
  const parts = html.split(/(?=<h2 )/), n = parts.length - 1, used = new Set();
  imgs.forEach((src, i) => {
    let pos = n > 0 ? Math.max(1, Math.round((n * (i + 1)) / (imgs.length + 1))) : 0;
    while (used.has(pos) && pos < n) pos++;
    used.add(pos);
    const alt = meta["image" + (i + 2) + "Alt"] || (meta.title + " (picture " + (i + 2) + ")");
    const fig = `<figure><img src="${esc(src)}" alt="${esc(alt)}" loading="lazy" width="1600" height="900"></figure>`;
    if (n === 0) parts[0] += fig; else parts[pos] = fig + parts[pos];
  });
  return parts.join("");
}

// ---------- read articles ----------
const dir = path.join(ROOT, "content");
const allArts = fs.readdirSync(dir).filter((f) => f.endsWith(".md") && !f.startsWith("_")).map((f) => {
  const raw = fs.readFileSync(path.join(dir, f), "utf8").replace(/^\uFEFF/, "");
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/), meta = {};
  if (!m) warn.push(`${f}: the top block between the two --- lines is missing or broken. The article is built without title/description.`);
  (m ? m[1] : "").split(/\r?\n/).forEach((l) => { const i = l.indexOf(":"); if (i > 0) meta[l.slice(0, i).trim()] = l.slice(i + 1).trim().replace(/^["']|["']$/g, ""); });
  if (/^(true|yes)$/i.test(meta.draft || "")) { console.log("Skipped draft: " + f); return null; }
  let s = f.replace(/\.md$/, "").trim(); // web address = file name (a "slug:" line in the article is ignored on purpose, so live addresses never change)
  if (!/^[a-z0-9-]+$/.test(s)) { const fixed = slug(s) || "article"; warn.push(`${f}: the web address used "${fixed}" instead, because the name had capitals, spaces or symbols. Rename the file to ${fixed}.md to keep things tidy.`); s = fixed; }
  if (!meta.title) warn.push(`${f}: "title:" is missing.`);
  if (!meta.description) warn.push(`${f}: "description:" is missing. Google shows it under your title.`);
  else if (meta.description.length > 160) warn.push(`${f}: description is ${meta.description.length} characters. Keep it under 155 so Google does not cut it.`);
  else if (meta.description.length < 70) warn.push(`${f}: description is short (${meta.description.length} characters). Aim for 120 to 155.`);
  if (!/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2})?(\.\d+)?(Z|[+-]\d{2}:?\d{2})?)?$/.test(meta.date || "")) warn.push(`${f}: date must look like 2026-11-17 (year-month-day, with zeros).`);
  else if (meta.date.slice(0, 10) > new Date().toISOString().slice(0, 10)) warn.push(`${f}: date ${meta.date} is in the future. It is still published now. Check the date.`);
  const body = md(m ? m[2] : raw, f, meta.title);
  // AUTO PICTURES: put pictures in static/images/ named like the article file: <name>.jpg = top picture, <name>-2.jpg / -3.jpg / -4.jpg = placed inside the article.
  let imgNames = []; try { imgNames = fs.readdirSync(path.join(STATIC, "images")); } catch (e) {}
  const findImg = (n) => { const x = imgNames.find((y) => /\.(jpe?g|png|webp)$/i.test(y) && y.replace(/\.[^.]+$/, "") === n); return x ? "/images/" + x : ""; };
  const extraImgs = [2, 3, 4].map((k) => findImg(s + "-" + k)).filter(Boolean);
  let image = meta.image ? normImg(meta.image) : findImg(s), imageAlt = meta.imageAlt || "";
  if (image && !checkImg(image, f)) image = "";
  if (!image && body.first) { image = body.first.src; imageAlt = imageAlt || body.first.alt; body.html = body.html.replace(body.first.html, ""); } // first picture in the article becomes the top banner
  if (image && !imageAlt) warn.push(`${f}: "imageAlt:" is missing. Describe the main picture in one short line.`);
  const words = body.html.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;
  if (words < 300) warn.push(`${f}: only about ${words} words. Match previews usually need 500 or more to be useful.`);
  return { slug: s, title: meta.title || s, desc: meta.description || "", date: (meta.date || "2026-01-01").slice(0, 10), dt: meta.date || "2026-01-01", lang: /^[a-z]{2}$/.test(meta.lang || "") ? meta.lang : "en", tr: String(meta.translation || "").trim(), cat: meta.category || "Articles", image, imageAlt: imageAlt || meta.title || "", author: AUTHOR || meta.author || NAME, html: placeImgs(body.html, extraImgs, meta), toc: body.toc, min: Math.max(1, Math.round(words / 200)) };
}).filter(Boolean).sort((a, b) => b.date.localeCompare(a.date) || b.dt.localeCompare(a.dt));
// English articles drive the home page, topics, slider and search. Articles with "lang: fr" live on their own French page (/fr/), reached by the "Français" button in the menu.
const arts = allArts.filter((a) => a.lang === "en"), frArts = allArts.filter((a) => a.lang !== "en");
// Translations: write "translation: <slug of the other language version>" in one of the two files. Both pages then get hreflang tags and a language link.
allArts.forEach((a) => { if (!a.tr) return; const b = allArts.find((x) => x.slug === a.tr); if (!b) { warn.push(`${a.slug}.md: translation "${a.tr}" was not found yet, so no language link was added.`); return; } if (b === a || b.lang === a.lang) { warn.push(`${a.slug}.md: translation "${a.tr}" is in the same language, so it was ignored.`); return; } a.alt = a.alt || b; b.alt = b.alt || a; });

{ const seen = {}; allArts.forEach((a) => { if (seen[a.slug]) warn.push(`Two articles use the same web address "${a.slug}". One will overwrite the other.`); seen[a.slug] = 1; }); }
const catMap = {}; arts.forEach((a) => { const k = slug(a.cat) || "articles"; (catMap[k] = catMap[k] || { name: a.cat, slug: k, list: [] }).list.push(a); });
const cats = Object.values(catMap).sort((a, b) => b.list.length - a.list.length);

// ---------- covers: every article gets a picture card automatically ----------
// If an article has its own image (image: in the top block) that is used. Otherwise a branded card is drawn at build time (a small SVG file).
const THEMES = [
  { bg: "#021f15", bg2: "#05563a", acc: "#3ce3a2", panel: "#0a6b48" },
  { bg: "#02281b", bg2: "#06402d", acc: "#d9f99d", panel: "#0b7a52" },
  { bg: "#032a1c", bg2: "#07a468", acc: "#ffffff", panel: "#06402d" },
  { bg: "#021f15", bg2: "#0a6b48", acc: "#10c37e", panel: "#05563a" },
];
const hash = (s) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
const wrapWords = (t, max) => { const out = []; let line = ""; for (const w of t.split(/\s+/)) { const n = (line + " " + w).trim(); if (n.length <= max) line = n; else { if (line) out.push(line); line = w; } } if (line) out.push(line); return out; };
function coverSvg(a) {
  const th = THEMES[hash(a.slug) % THEMES.length]; let size = 100, lines = [];
  for (; size >= 50; size -= 6) { lines = wrapWords(a.title, Math.floor(780 / (size * 0.6))); if (lines.length <= (size >= 76 ? 4 : 5)) break; }
  if (lines.length > 5) { lines = lines.slice(0, 5); lines[4] = lines[4].replace(/\s*\S*$/, "") + "..."; }
  const lh = size * 1.14, top = 450 - ((lines.length - 1) * lh) / 2 + size * 0.35;
  const pent = (cx, cy, r, rot) => Array.from({ length: 5 }, (_, k) => (cx + r * Math.cos(rot + (k * 2 * Math.PI) / 5)).toFixed(1) + "," + (cy + r * Math.sin(rot + (k * 2 * Math.PI) / 5)).toFixed(1)).join(" ");
  const bx = 1290, by = 450, br = 150;
  let patches = `<polygon points="${pent(bx, by, br * 0.34, -Math.PI / 2)}" fill="#141a22"/>`;
  for (let k = 0; k < 5; k++) { const ang = -Math.PI / 2 + (k * 2 * Math.PI) / 5, px = bx + br * 0.8 * Math.cos(ang), py = by + br * 0.8 * Math.sin(ang); patches += `<line x1="${(bx + br * 0.34 * Math.cos(ang)).toFixed(1)}" y1="${(by + br * 0.34 * Math.sin(ang)).toFixed(1)}" x2="${px.toFixed(1)}" y2="${py.toFixed(1)}" stroke="#aab3bf" stroke-width="5"/><polygon points="${pent(px, py, br * 0.22, ang + Math.PI / 2)}" fill="#141a22"/>`; }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" width="1600" height="900" font-family="Arial, Helvetica, sans-serif"><title>${esc(a.title)}</title><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${th.bg2}"/><stop offset="1" stop-color="${th.bg}"/></linearGradient></defs><rect width="1600" height="900" fill="url(#g)"/><polygon points="1120,0 1600,0 1600,900 880,900" fill="${th.panel}"/><polygon points="1120,0 1190,0 950,900 880,900" fill="${th.acc}" opacity="0.9"/><circle cx="${bx}" cy="${by}" r="330" fill="none" stroke="#fff" stroke-opacity="0.12" stroke-width="10"/><circle cx="${bx}" cy="${by}" r="250" fill="none" stroke="#fff" stroke-opacity="0.2" stroke-width="10"/><circle cx="${bx}" cy="${by + 8}" r="${br}" fill="#000" opacity="0.25"/><circle cx="${bx}" cy="${by}" r="${br}" fill="#f6f8fa"/>${patches}<text x="100" y="170" font-size="34" font-weight="700" letter-spacing="4" fill="${th.acc}">${esc(a.cat.toUpperCase())}</text><rect x="100" y="196" width="120" height="8" fill="${th.acc}"/>${lines.map((l, k) => `<text x="100" y="${(top + k * lh).toFixed(0)}" font-size="${size}" font-weight="800" fill="#fff">${esc(l)}</text>`).join("")}<text x="100" y="810" font-size="34" font-weight="700" fill="#fff">Pitchside<tspan fill="${th.acc}">Notes</tspan></text><text x="100" y="852" font-size="28" fill="#fff" fill-opacity="0.7">${esc(fmt(a.date))}</text></svg>`;
}
allArts.forEach((a) => { a.cover = a.image ? { src: a.image, alt: a.imageAlt } : { src: `/covers/${a.slug}.svg`, alt: a.title, gen: true }; });

// ---------- page pieces ----------
const catMap2 = () => cats;
const SEARCH = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5L21 21"/></svg>`;
const head = () => `<header class="top"><div class="w top-in"><a class="logo" href="/">Pitchside<b>Notes</b></a><nav class="nav" aria-label="Main"><a href="/">Home</a>${cats.map((c) => `<a href="/category/${c.slug}/">${esc(c.name)}</a>`).join("")}<a href="/articles/">All articles</a>${frArts.length ? `<a href="/fr/" lang="fr">Français</a>` : ""}<a href="${KP}/mls-live-scores/" rel="noopener">Live scores</a><a href="/about/">About</a></nav><a class="srch" href="/articles/#search" aria-label="Search articles">${SEARCH}</a></div></header>`;
const foot = () => `<footer><div class="w"><p>${NAME} is an independent football site. It is not affiliated with Major League Soccer, UEFA, any club or any broadcaster. Predictions are opinions for entertainment, not betting advice.</p><p><a href="/about/">About</a> <a href="/privacy-policy/">Privacy policy</a> <a href="${KP}/" rel="noopener">KickPulse live scores</a></p><p class="kpfoot"><b>KickPulse:</b> ${kpLinks()}</p></div></footer>`;
const meta2 = (a) => `<div class="by"><span>${esc(a.author)}</span><time datetime="${a.date}">${fmt(a.date, (UI[a.lang] || {}).loc)}</time><span>${a.min} ${(UI[a.lang] || {}).min || "min read"}</span></div>`;
const kick = (a) => (a.lang !== "en" ? `<a class="kick" href="/fr/">${(UI[a.lang] || {}).name || esc(a.lang)}</a>` : `<a class="kick" href="/category/${slug(a.cat)}/">${esc(a.cat)}</a>`);
const card = (a) => `<article class="c" data-t="${esc((a.title + " " + a.cat + " " + a.desc).toLowerCase())}"><a class="img" href="/articles/${a.slug}/" tabindex="-1" aria-hidden="true"><img src="${esc(a.cover.src)}" alt="${esc(a.cover.alt)}" loading="lazy" width="1600" height="900"></a>${kick(a)}<h3><a href="/articles/${a.slug}/">${esc(a.title)}</a></h3>${meta2(a)}</article>`;
const feature = (a) => `<article class="feature"><a class="img" href="/articles/${a.slug}/" tabindex="-1" aria-hidden="true"><img src="${esc(a.cover.src)}" alt="${esc(a.cover.alt)}" fetchpriority="high" width="1600" height="900"></a><div class="tx">${kick(a)}<h2><a href="/articles/${a.slug}/">${esc(a.title)}</a></h2><p>${esc(a.desc)}</p>${meta2(a)}</div></article>`;
const liveBox = () => `<section class="box live"><h2>Follow the games live</h2><p>Scores, schedules and playoff matches are on our sister site KickPulse.</p><a class="btn" href="${KP}/mls-live-scores/" rel="noopener">MLS live scores today</a><p class="kpmore">${KPL.slice(1).map((l) => `<a href="${KP}${l[0]}" rel="noopener">${l[1]}</a>`).join("")}</p></section>`;
const side = (ex) => `<aside class="side">${liveBox()}${arts.filter((a) => a.slug !== ex).length ? `<section class="box"><h2>Latest articles</h2><ul class="list">${arts.filter((a) => a.slug !== ex).slice(0, 5).map((a) => `<li><a href="/articles/${a.slug}/">${esc(a.title)}</a><small>${fmt(a.date)}</small></li>`).join("")}</ul></section>` : ""}<section class="box"><h2>Topics</h2><ul class="list">${cats.map((c) => `<li><a href="/category/${c.slug}/">${esc(c.name)}</a><small>${c.list.length} ${c.list.length === 1 ? "article" : "articles"}</small></li>`).join("")}</ul></section></aside>`;
const lay = (main, o = {}) => `<div class="w lay"><div class="main">${main}</div>${side(o.ex)}</div>`;
const pagehead = (h, sub) => `<div class="w"><h1 class="pagehead">${esc(h)}</h1>${sub ? `<p class="psub">${esc(sub)}</p>` : ""}</div>`;
const listPage = (h, list, extra = "") => pagehead(h) + `<div class="w">${extra}<div class="cards">${list.map(card).join("")}</div></div>`;

// Vercel Web Analytics (official plain-HTML snippet). It only counts visits after Analytics is switched ON in the Vercel dashboard (project > Analytics tab > Enable).
const ANALYTICS = '<script>window.va=window.va||function(){(window.vaq=window.vaq||[]).push(arguments)};</script><script defer src="/_vercel/insights/script.js"></script>';
function page(o) { return page0(o).replace("</head>", '<link rel="stylesheet" href="/slider.css">' + ANALYTICS + "</head>"); }
const LOC = { en: "en_GB", fr: "fr_FR" };
const hreflang = (o) => { if (!o.alts || !o.alts.length) return ""; const me = { lang: o.lang || "en", url: o.url }, all = [me, ...o.alts], en = all.find((x) => x.lang === "en") || me; return all.map((x) => `<link rel="alternate" hreflang="${x.lang}" href="${SITE}${x.url}">`).join("") + `<link rel="alternate" hreflang="x-default" href="${SITE}${en.url}">` + (LOC[me.lang] ? `<meta property="og:locale" content="${LOC[me.lang]}">` : "") + o.alts.filter((x) => LOC[x.lang]).map((x) => `<meta property="og:locale:alternate" content="${LOC[x.lang]}">`).join(""); };
function page0(o) {
  const t = esc(o.title), im = o.image ? (isUrl(o.image) ? o.image : SITE + o.image) : SITE + "/og-default.jpg", ogIm = /\.svg$/.test(im) ? SITE + "/og-default.jpg" : im;
  return `<!DOCTYPE html><html lang="${o.lang || "en"}"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><meta name="theme-color" content="#ffffff"><title>${t}</title><meta name="description" content="${esc(o.desc)}">${VERIFY ? `<meta name="google-site-verification" content="${esc(VERIFY)}">` : ""}<link rel="canonical" href="${SITE}${o.url}">${hreflang(o)}<meta property="og:type" content="${o.type || "website"}"><meta property="og:site_name" content="${NAME}"><meta property="og:title" content="${t}"><meta property="og:description" content="${esc(o.desc)}"><meta property="og:url" content="${SITE}${o.url}"><meta property="og:image" content="${esc(ogIm)}">${o.imageAlt ? `<meta property="og:image:alt" content="${esc(o.imageAlt)}"><meta name="twitter:image:alt" content="${esc(o.imageAlt)}">` : ""}<meta name="twitter:card" content="summary_large_image"><link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Poppins:wght@400;500;600;700&display=swap"><link rel="stylesheet" href="/style.css">${o.ld ? '<script type="application/ld+json">' + JSON.stringify(o.ld) + "</script>" : ""}</head><body>${head()}<main>${o.body}</main>${foot()}</body></html>`;
}
function write(p, html) { const f = path.join(OUT, p, "index.html"); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, html); }

// ---------- build ----------
fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT, { recursive: true });
fs.cpSync(STATIC, OUT, { recursive: true, filter: (s) => { const b = path.basename(s); return !b.startsWith("_") && !b.startsWith("."); } });
fs.mkdirSync(path.join(OUT, "covers"), { recursive: true });
allArts.filter((a) => a.cover.gen).forEach((a) => fs.writeFileSync(path.join(OUT, "covers", a.slug + ".svg"), coverSvg(a)));

const widget = `<section class="today panel"><h2>MLS matches today</h2><div id="mls"><p>Loading today's matches…</p></div><p class="src">Scores from ESPN's public feed; times in your time zone.</p></section><script>fetch("https://site.api.espn.com/apis/site/v2/sports/soccer/usa.1/scoreboard").then(r=>r.json()).then(d=>{var e=d.events||[],h="";e.slice(0,12).forEach(function(v){var c=(v.competitions||[{}])[0].competitors||[],a=c[0],b=c[1],s=v.status.type;if(!a||!b)return;h+='<div class="g"><span>'+(s.state==="pre"?new Date(v.date).toLocaleString([],{weekday:"short",hour:"2-digit",minute:"2-digit"}):s.shortDetail)+'</span><b>'+a.team.displayName+'</b><i>'+(s.state==="pre"?"vs":a.score+" - "+b.score)+'</i><b>'+b.team.displayName+'</b></div>'});document.getElementById("mls").innerHTML=h||"<p>No MLS matches on the schedule right now. Check the articles below for previews.</p>"}).catch(function(){document.getElementById("mls").innerHTML="<p>Live scores are unavailable right now.</p>"})</script>`;


// ---------- HOME SLIDER ----------
// The NEWEST article (newest "date:") is always the first slide, automatically.
// After it, the slides follow the file slider.txt (top of the project). One line = one slide.
//   article:file-name-of-article            (takes picture, title and link from that article)
//   /images/pic.jpg | Title | Short text | /articles/some-article/ | Button text     (your own banner)
// If slider.txt is missing or empty, the 5 newest articles are shown.
function buildSlides() {
  const out = []; let raw = readTxt("slider.txt");
  const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith("#"));
  if (arts[0]) out.push({ img: arts[0].cover.src, alt: arts[0].cover.alt, tag: arts[0].cat, title: arts[0].title, text: arts[0].desc, href: `/articles/${arts[0].slug}/`, btn: "Read now" }); // newest article = first slide
  for (const l of lines) {
    if (/^latest(:\d+)?$/i.test(l)) { // latest:6 = add the 6 newest articles that are not already in the slider
      const n = parseInt(l.split(":")[1] || "5", 10);
      arts.filter((a) => !out.some((o) => o.href === `/articles/${a.slug}/`) && !lines.some((x) => x.toLowerCase().startsWith("article:" + a.slug))).slice(0, n).forEach((a) => out.push({ img: a.cover.src, alt: a.cover.alt, tag: a.cat, title: a.title, text: a.desc, href: `/articles/${a.slug}/`, btn: "Read now" }));
      continue;
    }
    if (/^article:/i.test(l)) {
      const parts = l.slice(8).split("|").map((x) => x.trim()), a = arts.find((x) => x.slug === parts[0]);
      if (!a) { warn.push(`slider.txt: article "${parts[0]}" was not found. Use the exact file name without .md.`); continue; }
      if (out.some((o) => o.href === `/articles/${a.slug}/`)) continue; // already in the slider (for example the newest article)
      out.push({ img: a.cover.src, alt: a.cover.alt, tag: a.cat, title: parts[1] || a.title, text: a.desc, href: `/articles/${a.slug}/`, btn: "Read now" });
    } else {
      const p = l.split("|").map((x) => x.trim()), src = normImg(p[0] || "");
      if (!p[0] || imgState(src) !== "ok") { warn.push(`slider.txt: picture "${p[0]}" not found in static/images/. That slide was skipped.`); continue; }
      out.push({ img: src, alt: p[1] || "", tag: "", title: p[1] || "", text: p[2] || "", href: p[3] || "/articles/", btn: p[4] || "Read now" });
    }
  }
  if (out.length < 2) arts.slice(0, 5).forEach((a) => { if (!out.some((o) => o.href === `/articles/${a.slug}/`)) out.push({ img: a.cover.src, alt: a.cover.alt, tag: a.cat, title: a.title, text: a.desc, href: `/articles/${a.slug}/`, btn: "Read now" }); });
  return out.slice(0, 20);
}
function sliderHtml() {
  const S = buildSlides(); if (!S.length) return "";
  const ext = (h) => (isUrl(h) ? ' rel="noopener"' : "");
  return `<section class="pn-slider" aria-roledescription="carousel" aria-label="Top stories"><div class="pn-stage">${S.map((x, i) => `<a class="pn-slide${i === 0 ? " on" : ""}" href="${esc(x.href)}"${ext(x.href)} aria-label="${esc(x.title)}"><span class="pn-img"><img src="${esc(x.img)}" alt="${esc(x.alt || x.title)}" width="1600" height="900"${i === 0 ? ' fetchpriority="high"' : ' loading="lazy"'}></span><span class="pn-cap">${x.tag ? `<small>${esc(x.tag)}</small>` : ""}<b>${esc(x.title)}</b>${x.text ? `<em>${esc(x.text)}</em>` : ""}<i>${esc(x.btn)} &rarr;</i></span></a>`).join("")}</div>${S.length > 1 ? `<button class="pn-nav pn-prev" type="button" aria-label="Previous slide">&#8249;</button><button class="pn-nav pn-next" type="button" aria-label="Next slide">&#8250;</button><div class="pn-dots">${S.map((_, i) => `<button type="button" aria-label="Slide ${i + 1}"${i === 0 ? ' class="on"' : ""}></button>`).join("")}</div>` : ""}</section><script>(function(){var r=document.querySelector(".pn-slider");if(!r)return;var s=[].slice.call(r.querySelectorAll(".pn-slide")),d=[].slice.call(r.querySelectorAll(".pn-dots button")),n=0,t;function go(i){n=(i+s.length)%s.length;s.forEach(function(e,k){e.classList.toggle("on",k===n)});d.forEach(function(e,k){e.classList.toggle("on",k===n)});s[n].querySelectorAll("img").forEach(function(m){m.loading="eager"})}function play(){stop();if(s.length>1&&!matchMedia("(prefers-reduced-motion: reduce)").matches)t=setInterval(function(){go(n+1)},5000)}function stop(){clearInterval(t)}var p=r.querySelector(".pn-prev"),x=r.querySelector(".pn-next");if(p)p.onclick=function(){go(n-1);play()};if(x)x.onclick=function(){go(n+1);play()};d.forEach(function(e,k){e.onclick=function(){go(k);play()}});r.addEventListener("mouseenter",stop);r.addEventListener("mouseleave",play);r.addEventListener("focusin",stop);r.addEventListener("focusout",play);var x0=null;r.addEventListener("touchstart",function(e){x0=e.touches[0].clientX},{passive:true});r.addEventListener("touchend",function(e){if(x0===null)return;var dx=e.changedTouches[0].clientX-x0;if(Math.abs(dx)>40){go(n+(dx<0?1:-1));play()}x0=null});play()})()</script>`;
}

const statsHtml = () => `<div class="w"><div class="stats">${STATS().map((x) => `<div class="stat"><b>${esc(x[0])}</b><span>${esc(x[1])}</span></div>`).join("")}</div></div>`;
const tickerHtml = () => { const g = TICKER.concat(TICKER).map((t) => `<span>${esc(t)}</span><span class="tk-ball">&#9917;</span>`).join(""); return `<div class="ticker" aria-hidden="true"><div class="ticker-track"><div class="tk-g">${g}</div><div class="tk-g">${g}</div></div></div>`; };

// Home
const f0 = arts[0];
write("", page({
  title: `${NAME} | MLS previews, team news and match analysis`, desc: "MLS match previews, predicted lineups, team news, injury updates and match analysis, written for fans. Updated through the season.", url: "/", image: f0 && f0.image,
  body: pagehead("Pitchside Notes: MLS and football previews, guides and match news", "Match previews, predicted lineups, team news and international football guides, in plain English.") + statsHtml() + tickerHtml() +
    `<div class="w"><div class="home-top">${sliderHtml()}<aside class="side">${liveBox()}</aside></div><section class="sec">${widget}</section>${arts.length ? `<section class="sec"><h2 class="sh">Latest articles</h2><div class="cards">${arts.map(card).join("")}</div></section>` : ""}</div>`,
  ld: { "@context": "https://schema.org", "@type": "WebSite", name: NAME, url: SITE + "/" }
}));
// All articles (with search) + categories
write("articles", page({ title: `All articles | ${NAME}`, desc: "Every MLS preview, team news guide and analysis piece published on " + NAME + ".", url: "/articles/", body: listPage("All articles", arts, `<input id="q" class="sbox" type="search" placeholder="Search articles" aria-label="Search articles"><script>var q=document.getElementById("q"),cs=[].slice.call(document.querySelectorAll(".c"));q.addEventListener("input",function(){var v=q.value.toLowerCase();cs.forEach(function(c){c.style.display=c.getAttribute("data-t").indexOf(v)>-1?"":"none"})});if(location.hash==="#search")q.focus()</script>`) }));
for (const c of cats) write("category/" + c.slug, page({ title: `${c.name} | ${NAME}`, desc: `${c.name}: all ${NAME} articles on this topic.`, url: `/category/${c.slug}/`, body: listPage(c.name, c.list) }));
// Articles
if (frArts.length) write("fr", page({ lang: "fr", title: `Articles en français | ${NAME}`, desc: `Les articles de ${NAME} en français : aperçus de matchs, compositions probables et analyses.`, url: "/fr/", body: listPage("Articles en français", frArts) }));
for (const a of allArts) {
  const pool = a.lang === "en" ? arts : frArts;
  const rel = [...pool.filter((x) => x !== a && x.cat === a.cat), ...pool.filter((x) => x !== a && x.cat !== a.cat)].slice(0, 3);
  const L = UI[a.lang] || {};
  const toc = a.toc.length >= 3 ? `<nav class="toc" aria-label="${L.toc || "In this article"}"><b>${L.toc || "In this article"}</b><ol>${a.toc.map((x) => `<li><a href="#${x.id}">${esc(x.text)}</a></li>`).join("")}</ol></nav>` : "";
  const body = lay(`<article class="post panel">${kick(a)}<h1>${esc(a.title)}</h1>${meta2(a)}${a.alt ? `<p class="langsw"><a href="/articles/${a.alt.slug}/" hreflang="${a.alt.lang}" lang="${a.alt.lang}">${(UI[a.alt.lang] || {}).sw || "Read this article in English"}</a></p>` : ""}${a.image ? `<figure class="cover"><img src="${esc(a.image)}" alt="${esc(a.imageAlt)}" fetchpriority="high" width="1600" height="900"></figure>` : ""}${toc}<div class="body">${a.html}</div><aside class="cta">${L.cta ? `<b>${L.ctaT}</b><p>${L.cta(KP + "/", KP + "/mls-schedule/")}</p>` : `<b>Follow the match live</b><p>Open <a href="${KP}/mls-live-scores/" rel="noopener">MLS live scores today</a> on KickPulse, check the <a href="${KP}/mls-schedule/" rel="noopener">MLS schedule</a>, or see <a href="${KP}/mls-on-tv/" rel="noopener">how to watch MLS on TV</a>.</p>`}</aside></article>${rel.length ? `<section class="sec"><h2 class="sh">${L.more || "Keep reading"}</h2><div class="cards">${rel.map(card).join("")}</div></section>` : ""}`, { ex: a.slug });
  write("articles/" + a.slug, page({ lang: a.lang, alts: a.alt ? [{ lang: a.alt.lang, url: `/articles/${a.alt.slug}/` }] : [], title: `${a.title} | ${NAME}`, desc: a.desc, url: `/articles/${a.slug}/`, image: a.image, imageAlt: a.image ? a.imageAlt : "", type: "article", body,
    ld: { "@context": "https://schema.org", "@type": "Article", inLanguage: a.lang, headline: a.title, description: a.desc, datePublished: a.dt, dateModified: a.dt, ...(a.image ? { image: [SITE + a.image] } : {}), author: { "@type": "Person", name: a.author }, mainEntityOfPage: SITE + "/articles/" + a.slug + "/", publisher: { "@type": "Organization", name: NAME } } }));
}
// About, privacy
const plain = (h, inner) => lay(`<article class="post panel"><h1>${h}</h1><div class="body">${inner}</div></article>`);
write("about", page({ title: `About ${NAME}`, desc: "Who writes " + NAME + " and how we cover Major League Soccer.", url: "/about/", body: plain(`About ${NAME}`, `<p>${NAME} publishes match previews, predicted lineups, team news and analysis for Major League Soccer and big international fixtures. Every article is written by us. Where we use facts from official club, league or federation announcements, we put them in our own words.</p><p>We are an independent fan site and are not affiliated with Major League Soccer, UEFA, any club, or any broadcaster. Predictions are opinions for entertainment only, and nothing here is betting advice.</p><p>Looking for scores instead of articles? Our sister site <a href="${KP}/" rel="noopener">KickPulse</a> has live football scores, including <a href="${KP}/mls-live-scores/" rel="noopener">MLS live scores today</a>.</p><p>Spotted a mistake? Tell us and we will correct it.</p>`) }));
write("privacy-policy", page({ title: `Privacy policy | ${NAME}`, desc: "How " + NAME + " handles visitor data.", url: "/privacy-policy/", body: plain("Privacy policy", `<p>${NAME} does not ask visitors for personal information. The site may use privacy-friendly analytics to count visits, and, if advertising is added later, Google AdSense may use cookies. Fonts are loaded from Google Fonts. We will update this page if any of this changes.</p><p>The live match box loads scores from ESPN's public feed in your browser.</p>`) }));
// sitemap + robots
const urls = [["/", ""], ["/articles/", ""], ["/about/", ""], ["/privacy-policy/", ""]].concat(cats.map((c) => [`/category/${c.slug}/`, c.list[0].date])).concat(frArts.length ? [["/fr/", frArts[0].date]] : []).concat(allArts.map((a) => [`/articles/${a.slug}/`, a.date]));
fs.writeFileSync(path.join(OUT, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map(([u, d]) => `<url><loc>${SITE}${u}</loc>${d ? `<lastmod>${d}</lastmod>` : ""}</url>`).join("")}</urlset>`);
if (!fs.existsSync(path.join(OUT, "robots.txt"))) fs.writeFileSync(path.join(OUT, "robots.txt"), `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`);

// articles.json: the KickPulse site reads this file to show the latest Pitchside Notes articles in its blue box.
fs.writeFileSync(path.join(OUT, "articles.json"), JSON.stringify({ updated: new Date().toISOString(), articles: arts.slice(0, 12).map((a) => ({ title: a.title, description: a.desc, date: a.date, category: a.cat, url: `${SITE}/articles/${a.slug}/`, image: a.image ? SITE + a.image : "" })) }));
console.log("Built " + allArts.length + " articles (" + frArts.length + " in French)");
if (warn.length) { console.log("\n=== CHECK THESE " + warn.length + " THINGS (the site still built) ==="); warn.forEach((w) => console.log(" - " + w)); }
else console.log("No problems found.");
