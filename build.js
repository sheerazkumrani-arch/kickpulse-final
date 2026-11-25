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
// Words used on pages, per language. "en" is the default.
const UI = {
  en: { toc: "In this article", min: "min read", loc: "en-GB", more: "Keep reading", name: "English", sw: "Read this article in English", by: "By", pub: "Published", upd: "Updated", home: "Home", back: "Back to all articles", backUrl: "/articles/", share: "Share this article", copy: "Copy link", copied: "Link copied", faq: "Frequently asked questions", next: "What this means next", notes: { takeaways: "Key takeaways", stats: "Key stats", analysis: "Our analysis", players: "Key players to watch", timeline: "Timeline", next: "What this means next" }, author: "Author" },
  fr: { toc: "Dans cet article", min: "min de lecture", loc: "fr-FR", ctaT: "Suivre le match en direct", cta: (a, b) => `Ouvrez <a href="${a}" rel="noopener">KickPulse</a> pour les scores en direct, ou consultez le <a href="${b}" rel="noopener">programme MLS</a>.`, more: "À lire aussi", name: "Français", sw: "Lire cet article en français", by: "Par", pub: "Publié le", upd: "Mis à jour", home: "Accueil", back: "Retour aux articles en français", backUrl: "/fr/", share: "Partager cet article", copy: "Copier le lien", copied: "Lien copié", faq: "Questions fréquentes", next: "Et maintenant ?", notes: { takeaways: "Points clés", stats: "Les chiffres", analysis: "Notre analyse", players: "Joueurs à suivre", timeline: "Chronologie", next: "Et maintenant ?" }, author: "Auteur" },
  ur: { toc: "اس مضمون میں", min: "منٹ کا مطالعہ", loc: "ur-PK", ctaT: "میچ لائیو دیکھیں", cta: (a, b) => `لائیو اسکور کے لیے <a href="${a}" rel="noopener">KickPulse</a> کھولیں، یا <a href="${b}" rel="noopener">MLS شیڈول</a> دیکھیں۔`, more: "مزید پڑھیں", name: "اردو", sw: "یہ مضمون اردو میں پڑھیں", by: "تحریر:", pub: "شائع شدہ", upd: "اپ ڈیٹ", home: "ہوم", back: "تمام اردو مضامین", backUrl: "/ur/", share: "یہ مضمون شیئر کریں", copy: "لنک کاپی کریں", copied: "لنک کاپی ہو گیا", faq: "اکثر پوچھے گئے سوالات", next: "آگے کیا ہوگا", notes: { takeaways: "اہم نکات", stats: "اہم اعداد و شمار", analysis: "ہمارا تجزیہ", players: "اہم کھلاڑی", timeline: "واقعات کی ترتیب", next: "آگے کیا ہوگا" }, author: "مصنف" },
};
const LANGS = ["en", "fr", "ur"], RTL = { ur: true };
const T = (lang) => UI[lang] || UI.en;
// Time zone used when an article gives a date/time WITHOUT a zone (you write in Pakistan time).
const TZ_OFFSET = "+05:00", TZ_NAME = "Asia/Karachi", TZ_LABEL = "PKT";
const fmt = (d, loc) => { const dm = String(d).match(/^(\d{4}-\d{2}-\d{2})/), x = new Date((dm ? dm[1] : d) + "T00:00:00Z"); return isNaN(x) ? d : x.toLocaleDateString(loc || "en-GB", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" }); };
// Turns "date:" (+ optional "time:") from the top block into one exact moment.
// 2026-11-21 + time: 18:00  -> 2026-11-21T18:00:00+05:00 (time known)
// 2026-11-19T12:00:00+05:00 -> used as written            (time known)
// 2026-11-21 alone          -> that day, no time is shown on the page (never a fake time)
function parseWhen(dateStr, timeStr) {
  const d = String(dateStr || "").trim(); if (!d) return null;
  let m = d.match(/^(\d{4}-\d{2}-\d{2})(?:[T ](\d{2}:\d{2})(:\d{2})?(\.\d+)?(Z|[+-]\d{2}:?\d{2})?)?$/); if (!m) return null;
  let day = m[1], hm = m[2], sec = m[3] || ":00", zone = m[5] || "";
  const t = String(timeStr || "").trim().match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (!hm && t) { hm = t[1].padStart(2, "0") + ":" + t[2]; sec = ":" + (t[3] || "00"); }
  if (zone && !zone.includes(":") && zone !== "Z") zone = zone.slice(0, 3) + ":" + zone.slice(3);
  const iso = hm ? `${day}T${hm}${sec}${zone || TZ_OFFSET}` : `${day}T00:00:00${TZ_OFFSET}`, ts = Date.parse(iso);
  return isNaN(ts) ? null : { day, iso, ts, hasTime: !!hm, out: hm ? iso : day };
}
// "22 November 2026, 18:00 PKT" (time only when the article gives one). Month names are written here, so the
// result is the same on every computer (some Node.js versions do not include French/Urdu month names).
const MONTHS = {
  en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
  fr: ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"],
  ur: ["جنوری", "فروری", "مارچ", "اپریل", "مئی", "جون", "جولائی", "اگست", "ستمبر", "اکتوبر", "نومبر", "دسمبر"],
};
const TZ_MIN = (() => { const m = TZ_OFFSET.match(/([+-])(\d{2}):(\d{2})/); return (m[1] === "-" ? -1 : 1) * (+m[2] * 60 + +m[3]); })();
function fmtWhen(w, lang) {
  if (!w) return "";
  const x = new Date(w.ts + TZ_MIN * 60000), M = MONTHS[lang] || MONTHS.en; // shown in Pakistan time
  const day = w.hasTime ? x.getUTCDate() : +w.day.slice(8, 10), mon = M[(w.hasTime ? x.getUTCMonth() : +w.day.slice(5, 7) - 1)], yr = w.hasTime ? x.getUTCFullYear() : +w.day.slice(0, 4);
  const d = lang === "fr" && day === 1 ? "1er" : String(day), txt = `${d} ${mon} ${yr}`;
  if (!w.hasTime) return txt;
  const hm = String(x.getUTCHours()).padStart(2, "0") + ":" + String(x.getUTCMinutes()).padStart(2, "0");
  return lang === "fr" ? `${txt} à ${hm.replace(":", "h")} ${TZ_LABEL}` : `${txt}${lang === "ur" ? "،" : ","} ${hm} ${TZ_LABEL}`;
}
const isUrl = (u) => /^https?:\/\//.test(u);
const normImg0 = (u) => (isUrl(u) || u.startsWith("/") ? u : "/" + u);
// SEO UPDATE: if a picture path is wrong (for example /images/some-folder/pic.jpg) but a file with the same name
// is in static/images/, that file is used, so the picture is not lost. The build log tells you to correct the path.
const normImg = (u) => { const s = normImg0(u); if (isUrl(s) || imgState(s) === "ok") return s; const b = s.split("/").pop(); if (b && imgState("/images/" + b) === "ok") { warn.push(`image "${s}" was not found, so "/images/${b}" was used instead. Please correct the path in the article.`); return "/images/" + b; } return s; };
// SEO UPDATE: real picture sizes (width/height) are read from the files, so the page does not "jump" while loading (better Core Web Vitals).
const SIZES = {};
function imgSize(src) {
  if (!src || isUrl(src)) return null; if (SIZES[src] !== undefined) return SIZES[src];
  let r = null;
  try {
    const b = fs.readFileSync(path.join(STATIC, decodeURI(src)));
    if (b[0] === 0x89 && b[1] === 0x50) r = [b.readUInt32BE(16), b.readUInt32BE(20)];
    else if (b[0] === 0xff && b[1] === 0xd8) { let i = 2; while (i + 9 < b.length) { if (b[i] !== 0xff) { i++; continue; } const mk = b[i + 1]; if (mk >= 0xc0 && mk <= 0xcf && mk !== 0xc4 && mk !== 0xc8 && mk !== 0xcc) { r = [b.readUInt16BE(i + 7), b.readUInt16BE(i + 5)]; break; } if (mk === 0xd8 || mk === 0x01 || (mk >= 0xd0 && mk <= 0xd7)) { i += 2; continue; } i += 2 + b.readUInt16BE(i + 2); } }
    else if (b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 12, 16) === "VP8X") r = [1 + b.readUIntLE(24, 3), 1 + b.readUIntLE(27, 3)];
    else if (/\.svg$/i.test(src)) { const m = b.toString("utf8", 0, 3000).match(/viewBox="\s*[\d.-]+[\s,]+[\d.-]+[\s,]+([\d.]+)[\s,]+([\d.]+)\s*"/); if (m) r = [Math.round(+m[1]), Math.round(+m[2])]; }
  } catch (e) {}
  return (SIZES[src] = r && r[0] > 0 && r[1] > 0 ? r : null);
}
const dims = (src, def) => { const d = imgSize(src); return d ? ` width="${d[0]}" height="${d[1]}"` : def || ""; };
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
  .replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (m, a, u) => (imgState(normImg(u)) === "ok" ? `<img src="${normImg(u)}" alt="${a}" loading="lazy" decoding="async"${dims(normImg(u))}>` : ""))
  .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, t, u) => `<a href="${u}"${isUrl(u) && !u.startsWith(SITE) ? ' rel="noopener"' : ""}>${t}</a>`)
  .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
  .replace(/(^|[\s(])\*([^*\s][^*]*?)\*(?=[\s).,;:!?]|$)/g, "$1<em>$2</em>");

function md(t, file, title, lang) {
  // Old articles had a pasted <script type="application/ld+json"> block. It showed as plain text on the page.
  // The builder now makes correct schema by itself, so these blocks are removed here (the .md file is not changed).
  t = t.replace(/<script[\s\S]*?<\/script>/gi, () => { warn.push(`${file}: a <script> block inside the article was ignored (schema is now added automatically).`); return ""; });
  const L = t.split(/\r?\n/), toc = [], used = {}; let o = "", i = 0, p = [], first = null, open = 0;
  const flush = () => { if (p.length) { o += "<p>" + inl(p.join(" ")) + "</p>"; p = []; } };
  const take = (re) => { const r = []; while (i < L.length && re.test(L[i])) r.push(L[i++]); return r; };
  while (i < L.length) {
    const l = L[i]; let m;
    if (!l.trim()) { flush(); i++; continue; }
    if ((m = l.match(/^!\[([^\]]*)\]\(\s*([^)\s]+)(?:\s+"([^"]*)")?\s*\)\s*$/))) {
      flush(); const src = normImg(m[2]), good = checkImg(src, file, m[1]); i++;
      if (!good) continue; // a missing picture is left out, so no broken-image box appears on the page
      const fig = `<figure><img src="${esc(src)}" alt="${esc(m[1])}" loading="lazy" decoding="async"${dims(src)}>${m[3] ? "<figcaption>" + inl(m[3]) + "</figcaption>" : ""}</figure>`;
      if (!first) first = { html: fig, src, alt: m[1] };
      o += fig; continue;
    }
    // SEO UPDATE: optional boxes. A line ":::takeaways" (or stats, analysis, players, timeline, next) opens a box, a line ":::" closes it.
    if ((m = l.match(/^:::\s*([a-z-]+)\s*(.*)$/i))) { flush(); const k = m[1].toLowerCase(), tt = m[2].trim() || (T(lang).notes || UI.en.notes)[k] || ""; o += `<section class="note note-${k}">${tt ? `<p class="note-t">${inl(tt)}</p>` : ""}`; open++; i++; continue; }
    if (/^:::\s*$/.test(l)) { flush(); if (open) { o += "</section>"; open--; } i++; continue; }
    if (/^# /.test(l)) { flush(); i++; continue; } // a "# Title" line is skipped: the page already shows "title:" as its only H1 (two H1s are bad for SEO)
    if ((m = l.match(/^-{3,}(!\[.*)$/))) { flush(); o += "<hr>"; L[i] = m[1]; continue; }
    if ((m = l.match(/^(##|###|####) (.+)$/))) {
      flush(); const n = Math.min(m[1].length, 4), base = slug(m[2]) || "section"; let id = base, k = 2; while (used[id]) id = base + "-" + k++; used[id] = 1;
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
  flush(); while (open-- > 0) o += "</section>"; return { html: o, toc, first };
}

function placeImgs(html, imgs, meta) {
  if (!imgs.length) return html;
  const parts = html.split(/(?=<h2 )/), n = parts.length - 1, used = new Set();
  imgs.forEach((src, i) => {
    let pos = n > 0 ? Math.max(1, Math.round((n * (i + 1)) / (imgs.length + 1))) : 0;
    while (used.has(pos) && pos < n) pos++;
    used.add(pos);
    const alt = meta["image" + (i + 2) + "Alt"] || (meta.title + " (picture " + (i + 2) + ")");
    const fig = `<figure><img src="${esc(src)}" alt="${esc(alt)}" loading="lazy" decoding="async"${dims(src, ' width="1600" height="900"')}></figure>`;
    if (n === 0) parts[0] += fig; else parts[pos] = fig + parts[pos];
  });
  return parts.join("");
}

// ---------- FAQ: finds the "## FAQ" / "Frequently asked questions" / "Questions fréquentes" section ----------
// Questions can be written as "### Question?" or "**Question?**" with the answer below (or on the same line).
const FAQ_RE = /faq|frequently asked|questions fr[ée]quentes|اکثر پوچھے|سوالات/i;
const strip = (h) => h.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/\s+/g, " ").trim();
function takeFaq(html) {
  const parts = html.split(/(?=<h2 )/); const qa = [];
  for (let k = 0; k < parts.length; k++) {
    const h = parts[k].match(/^<h2 id="[^"]*">([\s\S]*?)<\/h2>/); if (!h || !FAQ_RE.test(strip(h[1]))) continue;
    const rest = parts[k].slice(h[0].length); let cur = null;
    rest.replace(/<h3 id="[^"]*">([\s\S]*?)<\/h3>|<p>([\s\S]*?)<\/p>|<(ul|ol)>[\s\S]*?<\/\3>/g, (all, h3, p) => {
      if (h3) { cur = { q: strip(h3), a: [] }; qa.push(cur); return all; }
      const sq = p !== undefined && p.match(/^<strong>([\s\S]+?)<\/strong>\s*([\s\S]*)$/);
      if (sq && /[?؟]\s*$/.test(strip(sq[1]))) { cur = { q: strip(sq[1]), a: sq[2] ? [strip(sq[2])] : [] }; qa.push(cur); return all; }
      if (cur) cur.a.push(strip(all)); return all;
    });
    parts[k] = `<section class="faq">${parts[k]}</section>`; // styled box on the page
  }
  return { html: parts.join(""), faq: qa.filter((x) => x.q && x.a.join(" ").trim()).map((x) => ({ q: x.q, a: x.a.join(" ").trim() })) };
}

// ---------- SEO UPDATE: categories and competitions ----------
// Category names that mean the same thing are merged, so one topic has one page (not two half-empty pages).
const CAT_ALIAS = { "mls match preview": "Match previews", "match preview": "Match previews", "preview": "Match previews", "match report": "Match reports", "report": "Match reports" };
function normCat(c, title, s, lang, f) {
  c = String(c || "").trim();
  if (c && CAT_ALIAS[c.toLowerCase()]) c = CAT_ALIAS[c.toLowerCase()];
  if (c && c.toLowerCase() !== "articles") return c;
  if (lang !== "en") return c || "Articles";
  const t = String(title).toLowerCase();
  const g = /\b\d{1,2}\s?[-–]\s?\d{1,2}\b|\bbeat\b|report|highlights|result/.test(t) ? "Match reports" : /\bvs?\b|preview|prediction/.test(t) ? "Match previews" : "Analysis";
  warn.push(`${f}: no "category:" line, so "${g}" was used. Add  category: ${g}  to the top block to choose it yourself.`);
  return g;
}
// Competition pages (/competition/premier-league/ etc.). Found from the title, file name, tags and description.
// Write  competition: La Liga  in the top block to choose it yourself. Add new competitions to this list.
const COMPS = [
  ["Premier League", /premier league|liverpool|man(chester)? united|man utd|pochettino|arsenal|chelsea|tottenham|manchester city|anfield/i],
  ["MLS", /\bmls\b|major league soccer|inter miami|orlando city|cincinnati|sounders|real salt lake|revolution|philadelphia union|nashville/i],
  ["Nations League", /nations league/i],
  ["Copa del Rey", /copa del rey/i],
  ["La Liga", /la liga|laliga/i],
  ["Champions League", /champions league/i],
  ["International friendlies", /friendly|friendlies|amical/i],
];
function findComp(meta, s, body) {
  if (meta.competition) return String(meta.competition).trim();
  const a = [meta.title, s.replace(/-/g, " "), meta.tags, meta.description].join(" "), b = String(body || "").slice(0, 1500);
  const hit = COMPS.find((c) => c[1].test(a)) || COMPS.find((c) => c[1].test(b));
  return hit ? hit[0] : "";
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
  // Older files use other names for the same fields. They are all understood now:
  meta.description = meta.description || meta.meta_description || meta.og_description || "";
  meta.image = meta.image || meta.featured_image || meta.og_image || "";
  meta.imageAlt = meta.imageAlt || meta.image_alt || "";
  meta.updated = meta.updated || meta.lastmod || meta.modified || "";
  if (!meta.title) warn.push(`${f}: "title:" is missing.`);
  if (!meta.description) warn.push(`${f}: "description:" is missing. Google shows it under your title.`);
  else if (meta.description.length > 160) warn.push(`${f}: description is ${meta.description.length} characters. Keep it under 155 so Google does not cut it.`);
  else if (meta.description.length < 70) warn.push(`${f}: description is short (${meta.description.length} characters). Aim for 120 to 155.`);
  const when = parseWhen(meta.date, meta.time), upd = parseWhen(meta.updated, meta.updated_time);
  if (!when) warn.push(`${f}: date is missing or wrong. Write it like  date: 2026-11-17  and  time: 18:30  (the page shows no date until this is fixed).`);
  else if (when.ts > Date.now() + 36e5) warn.push(`${f}: date ${meta.date} is in the future. It is still published now. Check the date.`);
  if (meta.updated && !upd) warn.push(`${f}: "updated:" must look like 2026-11-17 or 2026-11-17T18:30.`);
  const lang = LANGS.includes(String(meta.lang || "").trim().toLowerCase()) ? String(meta.lang).trim().toLowerCase() : "en";
  if (meta.lang && lang === "en" && !/^en$/i.test(meta.lang)) warn.push(`${f}: lang "${meta.lang}" is not known. Use en, fr or ur.`);
  // SEO UPDATE: optional top-block fields (see SEO-ARTICLE-CHECKLIST.md):
  //   key_takeaways: point one | point two | point three      -> "Key takeaways" box at the top
  //   what_next: one or two sentences                          -> "What this means next" section (before the FAQ)
  //   faq: Question one? :: Answer one || Question two? :: Answer two   -> visible FAQ section + FAQ schema (only if the article has no FAQ section yet)
  const L0 = T(lang), FAQH = /^##\s+.*(faq|frequently asked|questions fr|اکثر پوچھے|سوالات)/im; let src = m ? m[2] : raw;
  // SEO UPDATE: correction note. Write  correction: what was wrong and what you changed  together with  updated: 2026-11-25
  if (meta.correction) { const cw = parseWhen(meta.updated, meta.updated_time); if (!cw) warn.push(`${f}: "correction:" needs an "updated:" date.`); src = `:::next ${lang === "ur" ? "درستی" : "Correction"}\n${cw ? (lang === "ur" ? fmtWhen(cw, "ur") + " کو اپ ڈیٹ کیا گیا: " : "Updated on " + fmtWhen(cw, "en") + " to correct: ") : ""}${meta.correction}\n:::\n\n` + src; }
  if (meta.key_takeaways) src = ":::takeaways\n" + meta.key_takeaways.split("|").map((x) => x.trim()).filter(Boolean).map((x) => "- " + x).join("\n") + "\n:::\n\n" + src;
  if (meta.what_next) { const nx = `## ${L0.next}\n\n${meta.what_next}\n\n`, mm = src.match(FAQH); src = mm ? src.slice(0, mm.index) + nx + src.slice(mm.index) : src + "\n\n" + nx; }
  if (meta.faq && !FAQH.test(src)) src += `\n\n## ${L0.faq}\n\n` + meta.faq.split("||").map((x) => x.split("::")).filter((x) => x.length === 2 && x[0].trim() && x[1].trim()).map((x) => `### ${x[0].trim()}\n\n${x[1].trim()}`).join("\n\n") + "\n";
  if (!meta.author && !AUTHOR) warn.push(`${f}: "author:" is missing.`);
  const body = md(src, f, meta.title, lang);
  // AUTO PICTURES: put pictures in static/images/ named like the article file: <name>.jpg = top picture, <name>-2.jpg / -3.jpg / -4.jpg = placed inside the article.
  let imgNames = []; try { imgNames = fs.readdirSync(path.join(STATIC, "images")); } catch (e) {}
  const findImg = (n) => { const x = imgNames.find((y) => /\.(jpe?g|png|webp)$/i.test(y) && y.replace(/\.[^.]+$/, "") === n); return x ? "/images/" + x : ""; };
  const extraImgs = [2, 3, 4].map((k) => findImg(s + "-" + k)).filter(Boolean);
  let image = meta.image ? normImg(meta.image) : findImg(s), imageAlt = meta.imageAlt || "";
  if (image && !checkImg(image, f)) image = "";
  if (!image && body.first) { image = body.first.src; imageAlt = imageAlt || body.first.alt; body.html = body.html.replace(body.first.html, ""); } // first picture in the article becomes the top banner
  else if (image && body.first && body.first.src === image) { imageAlt = imageAlt || body.first.alt; body.html = body.html.replace(body.first.html, ""); } // same picture as the top banner: do not show it twice
  if (image && !imageAlt) warn.push(`${f}: "imageAlt:" is missing. Describe the main picture in one short line.`);
  const words = body.html.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;
  if (words < 300) warn.push(`${f}: only about ${words} words. Match previews usually need 500 or more to be useful.`);
  const fq = takeFaq(placeImgs(body.html, extraImgs, meta));
  return { slug: s, title: meta.title || s, desc: meta.description || "", when, upd: upd && when && upd.ts > when.ts ? upd : null, date: when ? when.day : "", dt: when ? when.out : "", ts: when ? when.ts : 0, lang, tr: String(meta.translation || "").trim(), cat: normCat(meta.category, meta.title || s, s, lang, f), comp: findComp(meta, s, src), seoTitle: meta.seo_title || "", time: !!(when && when.hasTime), image, imageAlt: imageAlt || meta.title || "", author: AUTHOR || meta.author || NAME, html: fq.html, faq: fq.faq, ev: { home: String(meta.home_team || "").trim(), away: String(meta.away_team || "").trim(), venue: String(meta.venue || "").trim(), start: String(meta.kickoff || "").trim() }, toc: body.toc, words, min: Math.max(1, Math.round(words / (lang === "ur" ? 150 : 200))) };
}).filter(Boolean).sort((a, b) => b.ts - a.ts || a.slug.localeCompare(b.slug)); // newest first by date AND time, everywhere
// English articles drive the home page, topics, slider and search. Articles with "lang: fr" live on their own French page (/fr/), reached by the "Français" button in the menu.
const arts = allArts.filter((a) => a.lang === "en"), frArts = allArts.filter((a) => a.lang === "fr"), urArts = allArts.filter((a) => a.lang === "ur");
const poolOf = (lang) => (lang === "fr" ? frArts : lang === "ur" ? urArts : arts);
// Translations: write "translation: <slug of the other language version>" in one of the two files. Both pages then get hreflang tags and a language link.
// You can list several, separated by commas (for example in the English file:  translation: my-article-fr, my-article-ur).
allArts.forEach((a) => { a.alts = []; });
const link2 = (a, b) => { if (!a.alts.includes(b)) a.alts.push(b); if (!b.alts.includes(a)) b.alts.push(a); };
allArts.forEach((a) => { if (!a.tr) return; a.tr.split(",").map((x) => x.trim()).filter(Boolean).forEach((t) => { const b = allArts.find((x) => x.slug === t); if (!b) { warn.push(`${a.slug}.md: translation "${t}" was not found yet, so no language link was added.`); return; } if (b === a || b.lang === a.lang) { warn.push(`${a.slug}.md: translation "${t}" is in the same language, so it was ignored.`); return; } link2(a, b); }); });
allArts.forEach((a) => { a.alts.slice().forEach((b) => b.alts.forEach((c) => { if (c !== a && c.lang !== a.lang) link2(a, c); })); a.alts = a.alts.filter((b, i, l) => l.findIndex((x) => x.lang === b.lang) === i); a.alt = a.alts[0]; }); // one version per language

{ const seen = {}; allArts.forEach((a) => { if (seen[a.slug]) warn.push(`Two articles use the same web address "${a.slug}". One will overwrite the other.`); seen[a.slug] = 1; }); }
const catMap = {}; arts.forEach((a) => { const k = slug(a.cat) || "articles"; (catMap[k] = catMap[k] || { name: a.cat, slug: k, list: [] }).list.push(a); });
const cats = Object.values(catMap).sort((a, b) => b.list.length - a.list.length);
const compMap = {}; arts.forEach((a) => { if (!a.comp) return; const k = slug(a.comp); (compMap[k] = compMap[k] || { name: a.comp, slug: k, list: [] }).list.push(a); });
const comps = Object.values(compMap).sort((a, b) => b.list.length - a.list.length);
// Same day, no time: the order on the page may be wrong. Ask for a "time:" line.
{ const byDay = {}; allArts.forEach((a) => { if (a.date) (byDay[a.lang + a.date] = byDay[a.lang + a.date] || []).push(a); }); const nt = []; Object.values(byDay).forEach((l) => { if (l.length > 1) l.filter((a) => !a.time).forEach((a) => nt.push(a.slug)); }); if (nt.length) warn.push(`${nt.length} articles share a date with another article but have no "time:" line, so their order on that day is a guess. Add  time: 18:30  (Pakistan time) to: ${nt.join(", ")}`); }
// SEO UPDATE: page titles. "Title | Pitchside Notes" when short enough, otherwise only the title (Google cuts titles longer than about 60-65 characters).
// You can write your own with  seo_title:  in the top block.
const pageTitle = (a) => a.seoTitle || (a.title.length + NAME.length + 3 <= 65 ? `${a.title} | ${NAME}` : a.title);
allArts.forEach((a) => { if (pageTitle(a).length > 70) warn.push(`${a.slug}.md: title is ${pageTitle(a).length} characters. Google shows about 60. Add a shorter  seo_title:  line.`); });

// ---------- SEO UPDATE: extra pages (About, Contact, Privacy, Editorial policy ...) from the pages/ folder ----------
// Each .md file in pages/ becomes a page. Top block: title, description, url (for example /contact/), optional lang (en, fr, ur),
// optional translation (url of the same page in another language, for example /fr/contact/), optional footer: no.
const PAGES = (() => { const d = path.join(ROOT, "pages"); let fl = []; try { fl = fs.readdirSync(d).filter((x) => x.endsWith(".md") && !x.startsWith("_")); } catch (e) {} return fl.map((x) => {
  const raw = fs.readFileSync(path.join(d, x), "utf8").replace(/^\uFEFF/, ""), mm = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/), mt = {};
  (mm ? mm[1] : "").split(/\r?\n/).forEach((l) => { const i = l.indexOf(":"); if (i > 0) mt[l.slice(0, i).trim()] = l.slice(i + 1).trim().replace(/^["']|["']$/g, ""); });
  if (/^(true|yes)$/i.test(mt.draft || "")) return null;
  let url = (mt.url || "/" + x.replace(/\.md$/, "") + "/").trim(); if (!url.startsWith("/")) url = "/" + url; if (!url.endsWith("/")) url += "/";
  const lang = LANGS.includes(mt.lang) ? mt.lang : "en";
  if (!mt.title || !mt.description) warn.push(`pages/${x}: "title:" and "description:" are needed.`);
  return { file: x, url, lang, title: mt.title || x, desc: mt.description || "", tr: mt.translation || "", footer: !/^no$/i.test(mt.footer || ""), sameAs: mt.sameAs || "", updated: mt.updated || "", html: md(mm ? mm[2] : raw, "pages/" + x, mt.title, lang).html };
}).filter(Boolean); })();
const pageAt = (u) => PAGES.find((p) => p.url === u);
const AUTHOR_NAME = AUTHOR || NAME, AUTHOR_URL = `/author/${slug(AUTHOR_NAME)}/`;
const authorInfo = pageAt(AUTHOR_URL); // optional pages/author.md with  url: /author/sheeraz-khan/  (bio + sameAs social links)

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
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" width="1600" height="900" font-family="Arial, Helvetica, sans-serif"><title>${esc(a.title)}</title><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${th.bg2}"/><stop offset="1" stop-color="${th.bg}"/></linearGradient></defs><rect width="1600" height="900" fill="url(#g)"/><polygon points="1120,0 1600,0 1600,900 880,900" fill="${th.panel}"/><polygon points="1120,0 1190,0 950,900 880,900" fill="${th.acc}" opacity="0.9"/><circle cx="${bx}" cy="${by}" r="330" fill="none" stroke="#fff" stroke-opacity="0.12" stroke-width="10"/><circle cx="${bx}" cy="${by}" r="250" fill="none" stroke="#fff" stroke-opacity="0.2" stroke-width="10"/><circle cx="${bx}" cy="${by + 8}" r="${br}" fill="#000" opacity="0.25"/><circle cx="${bx}" cy="${by}" r="${br}" fill="#f6f8fa"/>${patches}<text x="100" y="170" font-size="34" font-weight="700" letter-spacing="4" fill="${th.acc}">${esc(a.cat.toUpperCase())}</text><rect x="100" y="196" width="120" height="8" fill="${th.acc}"/>${lines.map((l, k) => `<text x="100" y="${(top + k * lh).toFixed(0)}" font-size="${size}" font-weight="800" fill="#fff">${esc(l)}</text>`).join("")}<text x="100" y="810" font-size="34" font-weight="700" fill="#fff">Pitchside<tspan fill="${th.acc}">Notes</tspan></text><text x="100" y="852" font-size="28" fill="#fff" fill-opacity="0.7">${esc(fmtWhen(a.when, "en"))}</text></svg>`;
}
allArts.forEach((a) => { a.cover = a.image ? { src: a.image, alt: a.imageAlt } : { src: `/covers/${a.slug}.svg`, alt: a.title, gen: true }; });

// ---------- page pieces ----------
const catMap2 = () => cats;
const SEARCH = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5L21 21"/></svg>`;
// ---------- top menu ----------
// Menu: Home (mobile only, the logo is Home on desktop), the 4 biggest English topics, All articles, Live scores, About, اردو.
// The old "Français" button is replaced by the small "FR" box (latest French articles) next to the search icon.
const NAVCATS = 4;
const frList = (n) => frArts.slice(0, n).map((a) => `<li><a href="/articles/${a.slug}/" lang="fr">${esc(a.title)}</a><small>${esc(fmtWhen(a.when, "fr"))}</small></li>`).join("");
const frDrop = () => !frArts.length ? "" : `<details class="frbox"><summary aria-label="Articles en français / French articles"><span class="fr-tag">FR</span><span class="fr-lbl">Articles en français</span></summary><div class="fr-pop"><b>Articles en français</b><small class="fr-sub">Latest French articles</small>${frArts.length ? `<ul class="list">${frList(4)}</ul>` : `<p class="fr-none">Bientôt disponible. Coming soon.</p>`}<a class="fr-all" href="/fr/" lang="fr">Voir tous les articles en français &rarr;</a></div></details>`;
const BURGER = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>`;
const head = () => `<header class="top"><div class="w top-in"><a class="logo" href="/" aria-label="${NAME} home">Pitchside<b>Notes</b></a><nav class="nav" id="nav" aria-label="Main"><a class="nv-home" href="/">Home</a>${cats.slice(0, NAVCATS).map((c) => `<a href="/category/${c.slug}/">${esc(c.name)}</a>`).join("")}<a href="/articles/">All articles</a><a href="${KP}/mls-live-scores/" rel="noopener">Live scores</a><a href="/about/">About</a><a class="nv-ur" href="/ur/" lang="ur" dir="rtl" hreflang="ur">اردو</a></nav><div class="tools">${frDrop()}<a class="srch" href="/articles/#search" aria-label="Search articles">${SEARCH}</a><button class="burger" type="button" aria-label="Open menu" aria-controls="nav" aria-expanded="false">${BURGER}</button></div></div></header><script>(function(){var b=document.querySelector(".burger"),t=document.querySelector(".top");if(!b)return;b.onclick=function(){var o=t.classList.toggle("open");b.setAttribute("aria-expanded",o?"true":"false");b.setAttribute("aria-label",o?"Close menu":"Open menu")};document.addEventListener("click",function(e){var d=document.querySelector(".frbox[open]");if(d&&!d.contains(e.target))d.removeAttribute("open")})})()</script>`;
const foot = () => `<footer><div class="w"><p>${NAME} is an independent football site. It is not affiliated with Major League Soccer, UEFA, any club or any broadcaster. Predictions are opinions for entertainment, not betting advice.</p><p>${footLinks().map((l) => `<a href="${l[0]}">${esc(l[1])}</a>`).join(" ")} <a href="${KP}/" rel="noopener">KickPulse live scores</a></p>${comps.length ? `<p class="kpfoot"><b>Competitions:</b> ${comps.map((c) => `<a href="/competition/${c.slug}/">${esc(c.name)}</a>`).join(" ")}</p>` : ""}<p class="kpfoot"><b>KickPulse:</b> ${kpLinks()}</p></div></footer>`;
// SEO UPDATE: footer links to the trust pages. A link only appears when the page really exists.
const footLinks = () => [["/about/", "About"], ["/contact/", "Contact"], ["/editorial-policy/", "Editorial policy"], ["/corrections/", "Corrections"], ["/privacy-policy/", "Privacy policy"], [AUTHOR_URL, AUTHOR_NAME], ["/archive/", "Archive"]].filter((l) => ["/about/", "/privacy-policy/", AUTHOR_URL, "/archive/"].includes(l[0]) || (pageAt(l[0]) && pageAt(l[0]).footer));
const meta2 = (a) => `<div class="by"><span>${esc(a.author)}</span>${a.when ? `<time datetime="${a.dt}">${esc(fmtWhen(a.when, a.lang))}</time>` : ""}<span>${a.min} ${T(a.lang).min}</span></div>`;
// Full byline on the article page: By Sheeraz Khan · Published ... · Updated ... · 6 min read
const byline = (a) => { const L = T(a.lang); return `<div class="by byline"><span class="au">${L.by} <a href="${AUTHOR_URL}" rel="author">${esc(a.author)}</a></span>${a.when ? `<span>${L.pub} <time datetime="${a.dt}">${esc(fmtWhen(a.when, a.lang))}</time></span>` : ""}${a.upd ? `<span class="upd">${L.upd} <time datetime="${a.upd.out}">${esc(fmtWhen(a.upd, a.lang))}</time></span>` : ""}<span>${a.min} ${L.min}</span></div>`; };
const kick = (a) => (a.lang !== "en" ? `<a class="kick" href="/${a.lang}/">${T(a.lang).name}</a>` : `<a class="kick" href="/category/${slug(a.cat)}/">${esc(a.cat)}</a>`);
const card = (a) => `<article class="c"${a.lang !== "en" ? ` lang="${a.lang}"${RTL[a.lang] ? ' dir="rtl"' : ""}` : ""} data-t="${esc((a.title + " " + a.cat + " " + a.desc).toLowerCase())}"><a class="img" href="/articles/${a.slug}/" tabindex="-1" aria-hidden="true"><img src="${esc(a.cover.src)}" alt="${esc(a.cover.alt)}" loading="lazy" width="1600" height="900"></a>${kick(a)}<h3><a href="/articles/${a.slug}/">${esc(a.title)}</a></h3>${meta2(a)}</article>`;
const feature = (a) => `<article class="feature"><a class="img" href="/articles/${a.slug}/" tabindex="-1" aria-hidden="true"><img src="${esc(a.cover.src)}" alt="${esc(a.cover.alt)}" fetchpriority="high" width="1600" height="900"></a><div class="tx">${kick(a)}<h2><a href="/articles/${a.slug}/">${esc(a.title)}</a></h2><p>${esc(a.desc)}</p>${meta2(a)}</div></article>`;
const liveBox = () => `<section class="box live"><h2>Follow the games live</h2><p>Scores, schedules and playoff matches are on our sister site KickPulse.</p><a class="btn" href="${KP}/mls-live-scores/" rel="noopener">MLS live scores today</a><p class="kpmore">${KPL.slice(1).map((l) => `<a href="${KP}${l[0]}" rel="noopener">${l[1]}</a>`).join("")}</p></section>`;
// French box for empty side space: always shows the newest French articles (up to 4). With 0 articles it says "coming soon".
const frBox = () => !frArts.length ? "" : `<section class="box frside" lang="fr"><h2>Articles en français</h2>${frArts.length ? `<ul class="list">${frList(4)}</ul>` : `<p>Bientôt disponible.</p>`}<a class="fr-all" href="/fr/">Voir tous les articles en français &rarr;</a></section>`;
const side = (ex) => `<aside class="side">${ex === "/about/" ? "" : liveBox()}${frBox()}${arts.filter((a) => a.slug !== ex).length ? `<section class="box"><h2>Latest articles</h2><ul class="list">${arts.filter((a) => a.slug !== ex).slice(0, 5).map((a) => `<li><a href="/articles/${a.slug}/">${esc(a.title)}</a><small>${esc(fmtWhen(a.when, "en"))}</small></li>`).join("")}</ul></section>` : ""}${comps.length ? `<section class="box"><h2>Competitions</h2><ul class="list">${comps.map((c) => `<li><a href="/competition/${c.slug}/">${esc(c.name)}</a><small>${c.list.length} ${c.list.length === 1 ? "article" : "articles"}</small></li>`).join("")}</ul></section>` : ""}<section class="box"><h2>Topics</h2><ul class="list">${cats.map((c) => `<li><a href="/category/${c.slug}/">${esc(c.name)}</a><small>${c.list.length} ${c.list.length === 1 ? "article" : "articles"}</small></li>`).join("")}</ul></section></aside>`;
const lay = (main, o = {}) => `<div class="w lay"><div class="main">${main}</div>${side(o.ex)}</div>`;
const pagehead = (h, sub) => `<div class="w"><h1 class="pagehead">${esc(h)}</h1>${sub ? `<p class="psub">${esc(sub)}</p>` : ""}</div>`;
const listPage = (h, list, extra = "") => pagehead(h) + `<div class="w">${extra}<div class="cards">${list.map(card).join("")}</div></div>`;

// Vercel Web Analytics (official plain-HTML snippet). It only counts visits after Analytics is switched ON in the Vercel dashboard (project > Analytics tab > Enable).
const ANALYTICS = '<script>window.va=window.va||function(){(window.vaq=window.vaq||[]).push(arguments)};</script><script defer src="/_vercel/insights/script.js"></script>';
function page(o) { return page0(o).replace("</head>", '<link rel="stylesheet" href="/slider.css">' + ANALYTICS + "</head>"); }
const LOC = { en: "en_GB", fr: "fr_FR", ur: "ur_PK" };
// SEO UPDATE: one Organization block used by every page (social links come from  sameAs:  in pages/about.md, comma separated).
const ORG_LD = (() => { const ab = PAGES.find((p) => p.url === "/about/"), sa = ((ab && ab.sameAs) || "").split(",").map((x) => x.trim()).filter((x) => /^https:\/\//.test(x)); return { "@type": "Organization", "@id": SITE + "/#organization", name: NAME, url: SITE + "/", logo: { "@type": "ImageObject", url: SITE + "/og-default.jpg" }, ...(sa.length ? { sameAs: sa } : {}) }; })();
const crumbLd = (list) => ({ "@type": "BreadcrumbList", itemListElement: list.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c[0], item: SITE + c[1] })) });
const collLd = (name, url, list) => ({ "@context": "https://schema.org", "@graph": [{ "@type": "CollectionPage", "@id": SITE + url, name, url: SITE + url, isPartOf: { "@id": SITE + "/#website" }, mainEntity: { "@type": "ItemList", itemListElement: list.slice(0, 50).map((a, i) => ({ "@type": "ListItem", position: i + 1, url: `${SITE}/articles/${a.slug}/` })) } }, crumbLd([["Home", "/"], [name, url]]), ORG_LD] });
const hreflang = (o) => { if (!o.alts || !o.alts.length) return ""; const me = { lang: o.lang || "en", url: o.url }, all = [me, ...o.alts], en = all.find((x) => x.lang === "en") || me; return all.map((x) => `<link rel="alternate" hreflang="${x.lang}" href="${SITE}${x.url}">`).join("") + `<link rel="alternate" hreflang="x-default" href="${SITE}${en.url}">` + (LOC[me.lang] ? `<meta property="og:locale" content="${LOC[me.lang]}">` : "") + o.alts.filter((x) => LOC[x.lang]).map((x) => `<meta property="og:locale:alternate" content="${LOC[x.lang]}">`).join(""); };
function page0(o) {
  const t = esc(o.title), im = o.image ? (isUrl(o.image) ? o.image : SITE + o.image) : SITE + "/og-default.jpg", ogIm = /\.svg$/.test(im) ? SITE + "/og-default.jpg" : im;
  const lg = o.lang || "en";
  // Urdu font: on Urdu pages the full Noto Nastaliq Urdu font; on other pages only the 4 letters of "اردو" in the menu (tiny file).
  const urFont = lg === "ur" ? '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu:wght@400;600;700&family=Noto+Naskh+Arabic:wght@400;600;700&display=swap">' : '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu:wght@600&text=%D8%A7%D8%B1%D8%AF%D9%88&display=swap">';
  const art = o.art ? `<meta property="article:published_time" content="${o.art.pub}">${o.art.mod ? `<meta property="article:modified_time" content="${o.art.mod}">` : ""}<meta property="article:author" content="${esc(o.art.author)}">${o.art.section ? `<meta property="article:section" content="${esc(o.art.section)}">` : ""}` : "";
  return `<!DOCTYPE html><html lang="${lg}"${RTL[lg] ? ' dir="rtl"' : ""}><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><meta name="theme-color" content="#ffffff"><title>${t}</title><meta name="description" content="${esc(o.desc)}">${VERIFY ? `<meta name="google-site-verification" content="${esc(VERIFY)}">` : ""}<link rel="canonical" href="${SITE}${o.url}">${hreflang(o)}<meta property="og:type" content="${o.type || "website"}"><meta property="og:site_name" content="${NAME}"><meta property="og:title" content="${t}"><meta property="og:description" content="${esc(o.desc)}"><meta property="og:url" content="${SITE}${o.url}"><meta property="og:image" content="${esc(ogIm)}">${o.imageAlt ? `<meta property="og:image:alt" content="${esc(o.imageAlt)}"><meta name="twitter:image:alt" content="${esc(o.imageAlt)}">` : ""}<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${t}"><meta name="twitter:description" content="${esc(o.desc)}"><meta name="twitter:image" content="${esc(ogIm)}">${art}<link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Poppins:wght@400;500;600;700&display=swap">${urFont}<link rel="stylesheet" href="/style.css"><script>document.documentElement.classList.add("js")</script>${o.ld ? '<script type="application/ld+json">' + JSON.stringify(o.ld) + "</script>" : ""}</head><body>${head()}<main>${o.body}</main>${foot()}</body></html>`;
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
  // HOME TEXT (Step 4). Chosen from your Search Console queries: "mls matches today", "mls scores", "major league soccer results", previews, predictions, lineups.
  title: `MLS Match Previews, Predictions & Scores Today | ${NAME}`, desc: "MLS match previews, predictions and predicted lineups for today's games, plus team news, scores and results from every playoff round. Free to read.", url: "/", image: f0 && f0.image,
  body: pagehead("MLS match previews, predictions and scores today", "Previews, predicted lineups and team news for every MLS game, plus results and playoff guides. Written in plain English.") + statsHtml() + tickerHtml() +
    `<div class="w"><div class="home-top">${sliderHtml()}<aside class="side">${liveBox()}${frBox()}</aside></div><section class="sec">${widget}</section>${comps.length ? `<section class="sec"><h2 class="sh">Browse by competition</h2><p class="kpmore">${comps.map((c) => `<a href="/competition/${c.slug}/">${esc(c.name)} (${c.list.length})</a>`).join(" ")} <a href="/archive/">Full archive</a></p></section>` : ""}${arts.length ? `<section class="sec"><h2 class="sh">Latest articles</h2><div class="cards">${arts.map(card).join("")}</div></section>` : ""}</div>`,
  ld: { "@context": "https://schema.org", "@graph": [{ "@type": "WebSite", "@id": SITE + "/#website", name: NAME, url: SITE + "/", inLanguage: "en", publisher: { "@id": SITE + "/#organization" } }, ORG_LD] }
}));
// All articles (with search) + categories
write("articles", page({ title: `All articles | ${NAME}`, desc: "Every football preview, match report and analysis piece published on " + NAME + ", newest first: MLS, Premier League, Nations League and more.", url: "/articles/", ld: collLd("All articles", "/articles/", arts), body: listPage("All articles", arts, `<input id="q" class="sbox" type="search" placeholder="Search articles" aria-label="Search articles"><script>var q=document.getElementById("q"),cs=[].slice.call(document.querySelectorAll(".c"));q.addEventListener("input",function(){var v=q.value.toLowerCase();cs.forEach(function(c){c.style.display=c.getAttribute("data-t").indexOf(v)>-1?"":"none"})});if(location.hash==="#search")q.focus()</script>`) }));
for (const c of cats) write("category/" + c.slug, page({ title: `${c.name} | ${NAME}`, desc: `${c.name} on ${NAME}: ${c.list.length} football ${c.list.length === 1 ? "article" : "articles"}, newest first. ${c.list.slice(0, 2).map((a) => a.title).join("; ")}`.slice(0, 155), url: `/category/${c.slug}/`, ld: collLd(c.name, `/category/${c.slug}/`, c.list), body: listPage(c.name, c.list) }));
// SEO UPDATE: competition pages (/competition/mls/, /competition/premier-league/ ...): plain links to every article of that competition.
for (const c of comps) write("competition/" + c.slug, page({ title: `${c.name} previews, reports and analysis | ${NAME}`.length <= 65 ? `${c.name} previews, reports and analysis | ${NAME}` : `${c.name} | ${NAME}`, desc: `${c.name} articles on ${NAME}: match previews, reports and analysis. ${c.list.length} ${c.list.length === 1 ? "article" : "articles"}, newest first.`, url: `/competition/${c.slug}/`, ld: collLd(c.name, `/competition/${c.slug}/`, c.list), body: listPage(c.name, c.list) }));
// SEO UPDATE: archive with pages (50 links per page). Every article in every language, newest first, grouped by month.
{ const PER = 50, all = allArts.slice(), n = Math.max(1, Math.ceil(all.length / PER));
  for (let p = 1; p <= n; p++) {
    const part = all.slice((p - 1) * PER, p * PER), groups = []; part.forEach((a) => { const k = a.date ? a.date.slice(0, 7) : "-"; const g = groups[groups.length - 1]; if (g && g.k === k) g.l.push(a); else groups.push({ k, l: [a] }); });
    const ml = (k) => (k === "-" ? "No date" : MONTHS.en[+k.slice(5, 7) - 1] + " " + k.slice(0, 4)), url = p === 1 ? "/archive/" : `/archive/page/${p}/`;
    const pager = n > 1 ? `<nav class="pager" aria-label="Archive pages">${p > 1 ? `<a href="${p === 2 ? "/archive/" : `/archive/page/${p - 1}/`}">&larr; Newer</a>` : "<span></span>"}<span>Page ${p} of ${n}</span>${p < n ? `<a href="/archive/page/${p + 1}/">Older &rarr;</a>` : "<span></span>"}</nav>` : "";
    write(url.slice(1, -1), page({ title: `Archive${p > 1 ? " (page " + p + ")" : ""} | ${NAME}`, desc: `Every ${NAME} article by month, in English, French and Urdu${p > 1 ? ", page " + p : ""}.`, url, ld: collLd("Archive", url, part), body: lay(`<article class="post panel"><h1>Archive${p > 1 ? " – page " + p : ""}</h1><div class="body">${groups.map((g) => `<h2>${ml(g.k)}</h2><ul>${g.l.map((a) => `<li><a href="/articles/${a.slug}/"${a.lang !== "en" ? ` lang="${a.lang}"${RTL[a.lang] ? ' dir="rtl"' : ""}` : ""}>${esc(a.title)}</a> <small>${a.lang !== "en" ? T(a.lang).name + " · " : ""}${esc(fmtWhen(a.when, "en"))}</small></li>`).join("")}</ul>`).join("")}${pager}</div></article>`) }));
  } }
// Articles
// French section (/fr/): always built, newest first. Urdu section (/ur/): same idea, right-to-left.
if (frArts.length) write("fr", page({ lang: "fr", title: `Articles en français | ${NAME}`, desc: `Les articles de ${NAME} en français : aperçus de matchs, compositions probables, actualité MLS et analyses.`, url: "/fr/", body: frArts.length ? listPage("Articles en français", frArts) : pagehead("Articles en français", "Bientôt disponible.") }));
write("ur", page({ lang: "ur", title: `اردو مضامین | ${NAME}`, desc: "Pitchside Notes اردو میں: MLS میچ پریویوز، ٹیم نیوز، متوقع لائن اپس اور فٹ بال کی خبریں، آسان اردو میں۔", url: "/ur/",
  body: pagehead("اردو مضامین", "MLS اور فٹ بال کی خبریں، آسان اردو میں") + `<div class="w">${urArts.length ? `<div class="cards">${urArts.map(card).join("")}</div>` : `<section class="box soon"><h2>جلد آ رہا ہے</h2><p>ہمارے اردو مضامین بہت جلد یہاں شائع ہوں گے۔ تب تک آپ ہمارے <a href="/articles/" lang="en" dir="ltr">English articles</a> پڑھ سکتے ہیں یا <a href="${KP}/mls-live-scores/" rel="noopener">MLS لائیو اسکور</a> دیکھ سکتے ہیں۔</p><p lang="en" dir="ltr" class="soon-en">Urdu articles are coming soon.</p></section>`}</div>` }));
const SH = { x: '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M17.8 3h3.1l-6.8 7.8 8 10.2h-6.3l-4.9-6.4L5.3 21H2.2l7.3-8.3L1.8 3h6.4l4.4 5.9L17.8 3zm-1.1 16.2h1.7L7.4 4.7H5.6l11.1 14.5z"/></svg>', fb: '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M13.5 21v-7.5H16l.4-3h-2.9V8.6c0-.9.3-1.5 1.5-1.5h1.6V4.4c-.3 0-1.2-.1-2.3-.1-2.3 0-3.8 1.4-3.8 3.9v2.3H8v3h2.5V21h3z"/></svg>', wa: '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2c-1.5 0-3-.4-4.3-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.3-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2c0 1.3.9 2.5 1 2.7.1.2 1.8 2.8 4.4 3.9 1.6.7 2.3.8 3.1.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.7-.4z"/></svg>', li: '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M6.9 8.7H3.6V20h3.3V8.7zM5.2 3.5a1.9 1.9 0 1 0 0 3.8 1.9 1.9 0 0 0 0-3.8zM20.4 13.5c0-3-1.6-4.9-4.2-4.9-1.4 0-2.4.8-2.8 1.5V8.7h-3.2V20h3.3v-5.6c0-1.5.3-2.9 2.1-2.9s1.8 1.7 1.8 3V20h3.3v-6.5h-.3z"/></svg>', ln: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1 1"/><path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1-1"/></svg>' };
const shareHtml = (a) => { const L = T(a.lang), u = encodeURIComponent(`${SITE}/articles/${a.slug}/`), t = encodeURIComponent(a.title);
  return `<div class="share"><b>${L.share}</b><div class="share-b"><a class="sh-x" href="https://twitter.com/intent/tweet?url=${u}&amp;text=${t}" rel="noopener nofollow" target="_blank" aria-label="Share on X">${SH.x}<span>X</span></a><a class="sh-fb" href="https://www.facebook.com/sharer/sharer.php?u=${u}" rel="noopener nofollow" target="_blank" aria-label="Share on Facebook">${SH.fb}<span>Facebook</span></a><a class="sh-wa" href="https://wa.me/?text=${t}%20${u}" rel="noopener nofollow" target="_blank" aria-label="Share on WhatsApp">${SH.wa}<span>WhatsApp</span></a><a class="sh-li" href="https://www.linkedin.com/sharing/share-offsite/?url=${u}" rel="noopener nofollow" target="_blank" aria-label="Share on LinkedIn">${SH.li}<span>LinkedIn</span></a><button class="sh-cp" type="button" data-u="${SITE}/articles/${a.slug}/" data-ok="${esc(L.copied)}">${SH.ln}<span>${L.copy}</span></button></div></div><script>(function(){var b=document.querySelector(".sh-cp");if(!b)return;b.onclick=function(){var u=b.getAttribute("data-u"),s=b.querySelector("span"),o=s.textContent;(navigator.clipboard?navigator.clipboard.writeText(u):Promise.reject()).then(function(){s.textContent=b.getAttribute("data-ok");setTimeout(function(){s.textContent=o},2000)}).catch(function(){prompt("",u)})}})()</script>`; };
const RSTOP = new Set(["preview", "prediction", "match", "report", "guide", "today", "2026", "2027", "live", "score", "scores", "time", "with", "from", "after", "what", "lineups", "team", "news"]);
for (const a of allArts) {
  const pool = poolOf(a.lang);
  // SEO UPDATE: related articles = same competition, same teams/words in the address, same category, then newest. 4 plain links.
  const kw = (x) => new Set(x.slug.split("-").filter((w) => w.length > 3 && !RSTOP.has(w))), mine = kw(a);
  const score = (x) => (a.comp && x.comp === a.comp ? 4 : 0) + (x.cat === a.cat ? 1 : 0) + 2 * [...kw(x)].filter((w) => mine.has(w)).length;
  const rel = pool.filter((x) => x !== a && !a.alts.includes(x)).map((x) => [score(x), x]).sort((p, q) => q[0] - p[0] || q[1].ts - p[1].ts).slice(0, 4).map((p) => p[1]);
  const L = T(a.lang), url = `/articles/${a.slug}/`;
  // breadcrumb: Home > Topic (or language section) > this article
  const crumbs = a.lang === "en" ? [[L.home, "/"], [a.cat, `/category/${slug(a.cat)}/`], [a.title, url]] : [[L.home, "/"], [L.name, `/${a.lang}/`], [a.title, url]];
  const bc = `<nav class="crumbs" aria-label="Breadcrumb"><ol>${crumbs.map((c, i) => i < crumbs.length - 1 ? `<li><a href="${c[1]}">${esc(c[0])}</a></li>` : `<li aria-current="page">${esc(c[0])}</li>`).join("")}</ol></nav>`;
  const toc = a.toc.length >= 3 ? `<nav class="toc" aria-label="${L.toc}"><b>${L.toc}</b><ol>${a.toc.map((x) => `<li><a href="#${x.id}">${esc(x.text)}</a></li>`).join("")}</ol></nav>` : "";
  const sw = a.alts.length ? `<p class="langsw">${a.alts.map((b) => `<a href="/articles/${b.slug}/" hreflang="${b.lang}" lang="${b.lang}"${RTL[b.lang] ? ' dir="rtl"' : ""}>${T(b.lang).sw}</a>`).join("")}</p>` : "";
  const cta = L.cta ? `<b>${L.ctaT}</b><p>${L.cta(KP + "/mls-live-scores/", KP + "/mls-schedule/")}</p>` : `<b>Follow the match live</b><p>Open <a href="${KP}/mls-live-scores/" rel="noopener">MLS live scores today</a> on KickPulse, check the <a href="${KP}/mls-schedule/" rel="noopener">MLS schedule</a>, or see <a href="${KP}/mls-on-tv/" rel="noopener">how to watch MLS on TV</a>.</p>`;
  const body = lay(`<article class="post panel">${bc}${kick(a)}<h1>${esc(a.title)}</h1>${a.desc ? `<p class="dek">${esc(a.desc)}</p>` : ""}${byline(a)}${sw}${a.image ? `<figure class="cover"><img src="${esc(a.image)}" alt="${esc(a.imageAlt)}" fetchpriority="high"${dims(a.image, ' width="1600" height="900"')}></figure>` : ""}${toc}<div class="body">${a.html}</div><aside class="cta">${cta}</aside>${shareHtml(a)}<p class="back"><a href="${L.backUrl}">${RTL[a.lang] ? "&rarr;" : "&larr;"} ${L.back}</a></p></article>${rel.length ? `<section class="sec"><h2 class="sh">${L.more}</h2><div class="cards">${rel.map(card).join("")}</div></section>` : ""}`, { ex: a.slug });
  // Schema: NewsArticle + BreadcrumbList (+ FAQPage when the article has a FAQ section)
  const imgs = [a.image, ...[...a.html.matchAll(/<img src="([^"]+)"/g)].map((m) => m[1])].filter(Boolean).filter((x, i, l) => l.indexOf(x) === i).slice(0, 6).map((x) => (isUrl(x) ? x : SITE + x));
  const graph = [
    { "@type": "NewsArticle", "@id": SITE + url + "#article", inLanguage: a.lang, headline: a.title.slice(0, 110), description: a.desc, ...(a.when ? { datePublished: a.when.iso, dateModified: (a.upd || a.when).iso } : {}), ...(imgs.length ? { image: imgs } : {}), author: { "@type": "Person", "@id": SITE + AUTHOR_URL + "#person", name: a.author, url: SITE + AUTHOR_URL }, publisher: { "@id": SITE + "/#organization" }, mainEntityOfPage: { "@type": "WebPage", "@id": SITE + url }, articleSection: a.comp || a.cat, isAccessibleForFree: true, wordCount: a.words },
    ORG_LD,
    { "@type": "BreadcrumbList", itemListElement: crumbs.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c[0], item: SITE + c[1] })) },
  ];
  // SEO UPDATE 2: SportsEvent schema, ONLY when the top block has home_team, away_team and kickoff (for example kickoff: 2026-11-22T05:30+05:00).
  if (a.ev.home && a.ev.away && a.ev.start) { const ks = new Date(a.ev.start); if (isNaN(ks)) warn.push(`${a.slug}: "kickoff:" must look like 2026-11-22T05:30+05:00, so no match schema was added.`); else graph.push({ "@type": "SportsEvent", "@id": SITE + url + "#match", name: `${a.ev.home} vs ${a.ev.away}`, startDate: a.ev.start, sport: "Soccer", eventStatus: "https://schema.org/EventScheduled", homeTeam: { "@type": "SportsTeam", name: a.ev.home }, awayTeam: { "@type": "SportsTeam", name: a.ev.away }, competitor: [{ "@type": "SportsTeam", name: a.ev.home }, { "@type": "SportsTeam", name: a.ev.away }], ...(a.ev.venue ? { location: { "@type": "Place", name: a.ev.venue } } : {}), ...(a.comp ? { superEvent: { "@type": "SportsEvent", name: String(a.comp.name || a.comp) } } : {}) }); }
  else if (a.ev.home || a.ev.away || a.ev.start) warn.push(`${a.slug}: for match schema add all three lines: home_team:, away_team: and kickoff:.`);
  if (a.faq.length) graph.push({ "@type": "FAQPage", mainEntity: a.faq.map((x) => ({ "@type": "Question", name: x.q, acceptedAnswer: { "@type": "Answer", text: x.a } })) });
  write("articles/" + a.slug, page({ lang: a.lang, alts: a.alts.map((b) => ({ lang: b.lang, url: `/articles/${b.slug}/` })), title: pageTitle(a), desc: a.desc, url, image: a.image, imageAlt: a.image ? a.imageAlt : "", type: "article", art: a.when ? { pub: a.when.iso, mod: (a.upd || a.when).iso, author: a.author, section: a.cat } : null, body,
    ld: { "@context": "https://schema.org", "@graph": graph } }));
}
// About, privacy
const plain = (h, inner) => lay(`<article class="post panel"><h1>${h}</h1><div class="body">${inner}</div></article>`);
const BUILT_PAGES = new Set();
if (!pageAt("/about/")) write("about", page({ title: `About ${NAME}`, desc: "Who writes " + NAME + " and how we cover Major League Soccer.", url: "/about/", body: plain(`About ${NAME}`, `<p>${NAME} publishes match previews, predicted lineups, team news and analysis for Major League Soccer and big international fixtures. Every article is written by us. Where we use facts from official club, league or federation announcements, we put them in our own words.</p><p>We are an independent fan site and are not affiliated with Major League Soccer, UEFA, any club, or any broadcaster. Predictions are opinions for entertainment only, and nothing here is betting advice.</p><p>Looking for scores instead of articles? Our sister site <a href="${KP}/" rel="noopener">KickPulse</a> has live football scores, including <a href="${KP}/mls-live-scores/" rel="noopener">MLS live scores today</a>.</p><p>Spotted a mistake? Tell us and we will correct it.</p>`) }));
if (!pageAt("/privacy-policy/")) write("privacy-policy", page({ title: `Privacy policy | ${NAME}`, desc: "How " + NAME + " handles visitor data.", url: "/privacy-policy/", body: plain("Privacy policy", `<p>${NAME} does not ask visitors for personal information. The site may use privacy-friendly analytics to count visits, and, if advertising is added later, Google AdSense may use cookies. Fonts are loaded from Google Fonts. We will update this page if any of this changes.</p><p>The live match box loads scores from ESPN's public feed in your browser.</p>`) }));
// SEO UPDATE: pages from the pages/ folder (About, Contact, Privacy policy, Editorial policy, Corrections ...)
for (const p of PAGES) {
  if (p.url === AUTHOR_URL) continue; // the author page is built below
  const alts = p.tr.split(",").map((x) => x.trim()).filter(Boolean).map((u) => pageAt(u.endsWith("/") ? u : u + "/")).filter(Boolean).map((q) => ({ lang: q.lang, url: q.url }));
  const upd = parseWhen(p.updated);
  write(p.url.slice(1, -1), page({ lang: p.lang, alts, title: `${p.title} | ${NAME}`, desc: p.desc, url: p.url, ld: { "@context": "https://schema.org", "@graph": [{ "@type": p.url === "/about/" ? "AboutPage" : p.url === "/contact/" ? "ContactPage" : "WebPage", "@id": SITE + p.url, name: p.title, url: SITE + p.url, inLanguage: p.lang, isPartOf: { "@id": SITE + "/#website" }, ...(upd ? { dateModified: upd.iso } : {}) }, ORG_LD] },
    body: lay(`<article class="post panel"${p.lang !== "en" ? ` lang="${p.lang}"` : ""}><h1>${esc(p.title)}</h1>${upd ? `<p class="dek"><small>${T(p.lang).upd} <time datetime="${upd.out}">${esc(fmtWhen(upd, p.lang))}</time></small></p>` : ""}<div class="body">${p.html}</div></article>`, { ex: p.url }) }));
}
// SEO UPDATE: author page, linked from every byline. The bio comes from pages/author.md (url: /author/sheeraz-khan/) when you add it.
{ const mine = allArts.filter((a) => a.author === AUTHOR_NAME), sa = ((authorInfo && authorInfo.sameAs) || "").split(",").map((x) => x.trim()).filter((x) => /^https:\/\//.test(x));
  const bio = authorInfo ? authorInfo.html : `<p>${esc(AUTHOR_NAME)} writes the articles on ${NAME}.</p>`;
  write(AUTHOR_URL.slice(1, -1), page({ title: `${AUTHOR_NAME}, author at ${NAME}`, desc: (authorInfo && authorInfo.desc) || `Articles by ${AUTHOR_NAME} on ${NAME}: football previews, match reports and analysis in English, French and Urdu.`, url: AUTHOR_URL,
    ld: { "@context": "https://schema.org", "@graph": [{ "@type": "ProfilePage", "@id": SITE + AUTHOR_URL, url: SITE + AUTHOR_URL, name: AUTHOR_NAME, mainEntity: { "@id": SITE + AUTHOR_URL + "#person" } }, { "@type": "Person", "@id": SITE + AUTHOR_URL + "#person", name: AUTHOR_NAME, url: SITE + AUTHOR_URL, worksFor: { "@id": SITE + "/#organization" }, ...(sa.length ? { sameAs: sa } : {}) }, crumbLd([["Home", "/"], [AUTHOR_NAME, AUTHOR_URL]]), ORG_LD] },
    body: pagehead(AUTHOR_NAME, "Author") + `<div class="w"><section class="post panel"><div class="body">${bio}</div></section><section class="sec"><h2 class="sh">Articles by ${esc(AUTHOR_NAME)} (${mine.length})</h2><div class="cards">${mine.map(card).join("")}</div></section></div>` }));
}
// SEO UPDATE: 404 page (Vercel shows dist/404.html for any address that does not exist)
fs.writeFileSync(path.join(OUT, "404.html"), page({ title: `Page not found | ${NAME}`, desc: "This page does not exist. Find the latest football previews and reports on " + NAME + ".", url: "/404/", body: lay(`<article class="post panel"><h1>Page not found</h1><div class="body"><p>Sorry, this page does not exist or has moved.</p><p><a href="/">Go to the home page</a>, see <a href="/articles/">all articles</a> or the <a href="/archive/">archive</a>.</p><h2>Latest articles</h2><ul>${arts.slice(0, 6).map((a) => `<li><a href="/articles/${a.slug}/">${esc(a.title)}</a></li>`).join("")}</ul></div></article>`) }).replace('<link rel="canonical" href="' + SITE + '/404/">', '<meta name="robots" content="noindex">'));

// sitemap + robots
// SEO UPDATE: the sitemap is made from every page the build wrote, so no page is ever forgotten.
// Articles also list their other-language versions (hreflang), and <lastmod> is the real updated/published date.
const lm = (a) => { const w = a && (a.upd || a.when); return w ? (w.hasTime ? w.iso : w.day) : ""; };
const LASTMOD = { "/": lm(arts[0]), "/articles/": lm(arts[0]), "/archive/": lm(allArts[0]), "/fr/": lm(frArts[0]), "/ur/": lm(urArts[0]), [AUTHOR_URL]: lm(allArts[0]) };
cats.forEach((c) => (LASTMOD[`/category/${c.slug}/`] = lm(c.list[0]))); comps.forEach((c) => (LASTMOD[`/competition/${c.slug}/`] = lm(c.list[0])));
PAGES.forEach((p) => { const u = parseWhen(p.updated); if (u) LASTMOD[p.url] = u.hasTime ? u.iso : u.day; });
const ALTS = {}; allArts.forEach((a) => { LASTMOD[`/articles/${a.slug}/`] = lm(a); if (a.alts.length) ALTS[`/articles/${a.slug}/`] = [{ lang: a.lang, url: `/articles/${a.slug}/` }, ...a.alts.map((b) => ({ lang: b.lang, url: `/articles/${b.slug}/` }))]; });
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : e.name === "index.html" ? [path.join(d, e.name)] : []));
const urls = walk(OUT).map((f) => "/" + path.relative(OUT, path.dirname(f)).split(path.sep).join("/") + "/").map((u) => (u === "//" ? "/" : u)).sort((a, b) => (a === "/" ? -1 : b === "/" ? 1 : a.localeCompare(b)));
const smAlt = (u) => { const l = ALTS[u]; if (!l) return ""; const en = l.find((x) => x.lang === "en") || l[0]; return l.map((x) => `<xhtml:link rel="alternate" hreflang="${x.lang}" href="${SITE}${x.url}"/>`).join("") + `<xhtml:link rel="alternate" hreflang="x-default" href="${SITE}${en.url}"/>`; };
fs.writeFileSync(path.join(OUT, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls.map((u) => `<url><loc>${SITE}${u}</loc>${LASTMOD[u] ? `<lastmod>${LASTMOD[u]}</lastmod>` : ""}${smAlt(u)}</url>`).join("\n")}\n</urlset>\n`);
if (!fs.existsSync(path.join(STATIC, "og-default.jpg"))) warn.push("static/og-default.jpg is missing: pages without their own picture have no share image.");
if (!fs.existsSync(path.join(OUT, "robots.txt"))) fs.writeFileSync(path.join(OUT, "robots.txt"), `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`);

// articles.json: the KickPulse site reads this file to show the latest Pitchside Notes articles in its blue box.
fs.writeFileSync(path.join(OUT, "articles.json"), JSON.stringify({ updated: new Date().toISOString(), articles: arts.slice(0, 12).map((a) => ({ title: a.title, description: a.desc, date: a.date, category: a.cat, url: `${SITE}/articles/${a.slug}/`, image: a.image ? SITE + a.image : "" })) }));
// SEO UPDATE 2: llms.txt = a short plain-text guide for AI tools (ChatGPT, Gemini, Perplexity). Made automatically from your pages.
{ const pl = PAGES.filter((p) => p.url && !/^\/404/.test(p.url));
  fs.writeFileSync(path.join(OUT, "llms.txt"), `# ${NAME}\n\n> Football match previews, match reports and analysis written by ${AUTHOR || NAME}. Independent fan site, not connected to any league, club or broadcaster. Predictions are opinions, not betting advice.\n\n## About the site\n${pl.map((p) => `- [${p.title}](${SITE}${p.url}): ${p.desc || ""}`).join("\n")}\n- [All articles](${SITE}/archive/)\n- [Live scores (sister site KickPulse)](${KP}/)\n\n## Latest articles\n${allArts.slice(0, 40).map((a) => `- [${a.title}](${SITE}/articles/${a.slug}/) (${a.date}${a.lang !== "en" ? ", " + a.lang : ""}): ${a.desc}`).join("\n")}\n`); }
// SEO UPDATE: IndexNow key file (for Bing, Yandex and other IndexNow search engines). The key is in indexnow-key.txt. See README-SEO.md.
const INDEXNOW_KEY = readTxt("indexnow-key.txt");
if (/^[a-zA-Z0-9-]{8,128}$/.test(INDEXNOW_KEY)) fs.writeFileSync(path.join(OUT, INDEXNOW_KEY + ".txt"), INDEXNOW_KEY); else warn.push("indexnow-key.txt is missing or not valid, so the IndexNow key file was not created.");
// SEO UPDATE: final check of the finished pages (titles, descriptions, canonical, broken links, sitemap). See seo-check.js.
const seo = require("./seo-check.js")(OUT, SITE);
seo.warn.forEach((w) => warn.push("SEO check: " + w));
console.log("Built " + allArts.length + " articles (" + frArts.length + " in French, " + urArts.length + " in Urdu)");
{ const u = [...new Set(warn)]; warn.length = 0; warn.push(...u); }
if (seo.errors.length) { console.log("\n=== SEO ERRORS (" + seo.errors.length + ") ==="); seo.errors.forEach((e) => console.log(" ! " + e)); if (process.env.SEO_STRICT === "1") { console.log("SEO_STRICT=1 is set, so the build stops here."); process.exit(1); } }
if (warn.length) { console.log("\n=== CHECK THESE " + warn.length + " THINGS (the site still built) ==="); warn.forEach((w) => console.log(" - " + w)); }
else console.log("No problems found.");
