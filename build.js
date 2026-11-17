// Pitchside Notes site builder.
// Reads content/*.md and writes the finished website into dist/. Vercel runs this automatically (see vercel.json).
// You normally never edit this file. Site name and address are the three lines under "SETTINGS".
const fs = require("fs"), path = require("path");
const ROOT = __dirname, OUT = path.join(ROOT, "dist"), STATIC = path.join(ROOT, "static"), warn = [];

// ---------- SETTINGS ----------
const SITE = "https://kickpulse-final.vercel.app";          // your site address (no slash at the end)
const NAME = "Pitchside Notes";
const KP = "https://kickpulse-football.vercel.app";          // your KickPulse scores site
const KPL = [["/mls-live-scores/", "MLS live scores today"], ["/mls-schedule/", "MLS schedule"], ["/mls-on-tv/", "MLS on TV"], ["/mls-playoffs/", "MLS playoffs matches today"], ["/inter-miami-live-score/", "Inter Miami live score"]];
const kpLinks = () => KPL.map((l) => `<a href="${KP}${l[0]}" rel="noopener">${l[1]}</a>`).join("");
// Search Console "HTML tag" code: put ONLY the content value in the file verify.txt (see README). Nothing to edit here.
const readTxt = (f) => { try { return fs.readFileSync(path.join(ROOT, f), "utf8").trim(); } catch (e) { return ""; } };
const VERIFY = readTxt("verify.txt");

// ---------- helpers ----------
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const fmt = (d) => { const x = new Date(d + "T00:00:00Z"); return isNaN(x) ? d : x.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" }); };
const isUrl = (u) => /^https?:\/\//.test(u);
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
  .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, t, u) => `<a href="${u}"${isUrl(u) && !u.startsWith(SITE) ? ' rel="noopener"' : ""}>${t}</a>`)
  .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
  .replace(/(^|[\s(])\*([^*\s][^*]*?)\*(?=[\s).,;:!?]|$)/g, "$1<em>$2</em>");

function md(t, file) {
  const L = t.split(/\r?\n/), toc = [], used = {}; let o = "", i = 0, p = [];
  const flush = () => { if (p.length) { o += "<p>" + inl(p.join(" ")) + "</p>"; p = []; } };
  const take = (re) => { const r = []; while (i < L.length && re.test(L[i])) r.push(L[i++]); return r; };
  while (i < L.length) {
    const l = L[i]; let m;
    if (!l.trim()) { flush(); i++; continue; }
    if ((m = l.match(/^!\[([^\]]*)\]\(\s*([^)\s]+)(?:\s+"([^"]*)")?\s*\)\s*$/))) {
      flush(); checkImg(m[2], file, m[1]);
      o += `<figure><img src="${esc(m[2])}" alt="${esc(m[1])}" loading="lazy">${m[3] ? "<figcaption>" + inl(m[3]) + "</figcaption>" : ""}</figure>`; i++; continue;
    }
    if (/^# /.test(l)) { flush(); warn.push(`${file}: a line starting with "# " was skipped. The title comes from "title:" at the top, so do not repeat it in the article.`); i++; continue; }
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
    p.push(l.trim()); i++;
  }
  flush(); return { html: o, toc };
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
const s0 = (f) => f.replace(/\.md$/, "");
const dir = path.join(ROOT, "content");
const arts = fs.readdirSync(dir).filter((f) => f.endsWith(".md") && !f.startsWith("_")).map((f) => {
  const raw = fs.readFileSync(path.join(dir, f), "utf8").replace(/^\uFEFF/, "");
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/), meta = {};
  if (!m) warn.push(`${f}: the top block between the two --- lines is missing or broken. The article is built without title/description.`);
  (m ? m[1] : "").split(/\r?\n/).forEach((l) => { const i = l.indexOf(":"); if (i > 0) meta[l.slice(0, i).trim()] = l.slice(i + 1).trim().replace(/^["']|["']$/g, ""); });
  if (/^(true|yes)$/i.test(meta.draft || "")) { console.log("Skipped draft: " + f); return null; }
  const s = f.replace(/\.md$/, "");
  if (!/^[a-z0-9-]+$/.test(s)) warn.push(`${f}: the file name becomes the web address. Use only small English letters, numbers and dashes, no spaces.`);
  if (!meta.title) warn.push(`${f}: "title:" is missing.`);
  if (!meta.description) warn.push(`${f}: "description:" is missing. Google shows it under your title.`);
  else if (meta.description.length > 160) warn.push(`${f}: description is ${meta.description.length} characters. Keep it under 155 so Google does not cut it.`);
  else if (meta.description.length < 70) warn.push(`${f}: description is short (${meta.description.length} characters). Aim for 120 to 155.`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(meta.date || "")) warn.push(`${f}: date must look like 2026-11-17 (year-month-day, with zeros).`);
  else if (meta.date > new Date().toISOString().slice(0, 10)) warn.push(`${f}: date ${meta.date} is in the future. It is still published now. Check the date.`);
  let image = meta.image || "";
  if (image && !checkImg(image, f)) image = "";
  if (meta.image && !meta.imageAlt) warn.push(`${f}: "imageAlt:" is missing. Describe the main picture in one short line.`);
  // AUTO PICTURES: just put pictures in static/images/ named like the article file name.
  //   <name>.jpg = top picture, <name>-2.jpg, <name>-3.jpg, <name>-4.jpg = pictures placed inside the article.
  let imgNames = []; try { imgNames = fs.readdirSync(path.join(ROOT, "static", "images")); } catch (e) {}
  const findImg = (n) => { const f = imgNames.find((x) => /\.(jpe?g|png|webp)$/i.test(x) && x.replace(/\.[^.]+$/, "") === n); return f ? "/images/" + f : ""; };
  if (!image) image = findImg(s0(f));
  const extraImgs = [2, 3, 4].map((k) => findImg(s0(f) + "-" + k)).filter(Boolean);
  const body = md(m ? m[2] : raw, f), words = body.html.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;
  if (words < 300) warn.push(`${f}: only about ${words} words. Match previews usually need 500 or more to be useful.`);
  return { slug: s, title: meta.title || s, desc: meta.description || "", date: meta.date || "2026-01-01", cat: meta.category || "Articles", image, imageAlt: meta.imageAlt || meta.title || "", author: meta.author || NAME, html: placeImgs(body.html, extraImgs, meta), toc: body.toc, min: Math.max(1, Math.round(words / 200)) };
}).filter(Boolean).sort((a, b) => b.date.localeCompare(a.date));

const catMap = {}; arts.forEach((a) => { const k = slug(a.cat) || "articles"; (catMap[k] = catMap[k] || { name: a.cat, slug: k, list: [] }).list.push(a); });
const cats = Object.values(catMap).sort((a, b) => b.list.length - a.list.length);

// ---------- page pieces ----------
const head = () => `<header class="mast"><div class="w mast-in"><a class="logo" href="/">Pitchside<b>Notes</b></a><p class="tagline">MLS previews, team news and match analysis</p></div></header><nav class="bar" aria-label="Main"><div class="w bar-in"><a href="/">Home</a>${cats.map((c) => `<a href="/category/${c.slug}/">${esc(c.name)}</a>`).join("")}<a href="/articles/">All articles</a><a href="/about/">About</a></div></nav><div class="chips"><div class="w chips-in"><span>Discover more</span>${cats.map((c) => `<a href="/category/${c.slug}/">${esc(c.name)}</a>`).join("")}${kpLinks()}</div></div>`;
const foot = () => `<footer><div class="w"><p>${NAME} is an independent football site. It is not affiliated with Major League Soccer, its clubs or any broadcaster. Predictions are opinions for entertainment, not betting advice.</p><p><a href="/about/">About</a> <a href="/privacy-policy/">Privacy policy</a> <a href="${KP}/" rel="noopener">KickPulse live scores</a></p><p class="kpfoot"><b>KickPulse:</b> ${kpLinks()}</p></div></footer>`;
const thumb = (a) => a.image ? `<img src="${esc(a.image)}" alt="${esc(a.imageAlt)}" loading="lazy">` : "";
const card = (a) => `<article class="card"><a class="thumb" href="/articles/${a.slug}/" tabindex="-1" aria-hidden="true">${thumb(a)}</a><div class="ct"><a class="tag" href="/category/${slug(a.cat)}/">${esc(a.cat)}</a><h3><a href="/articles/${a.slug}/">${esc(a.title)}</a></h3><p>${esc(a.desc)}</p><small>${fmt(a.date)}</small></div></article>`;
const side = (ex) => `<aside class="side"><section class="box live"><h2>Follow the games live</h2><p>Scores, schedules and playoff matches are on our sister site KickPulse.</p><a class="btn" href="${KP}/mls-live-scores/" rel="noopener">MLS live scores today</a><p class="kpmore">${KPL.slice(1).map((l) => `<a href="${KP}${l[0]}" rel="noopener">${l[1]}</a>`).join("")}</p></section>${arts.filter((a) => a.slug !== ex).length ? `<section class="box"><h2>Latest articles</h2><ul class="list">${arts.filter((a) => a.slug !== ex).slice(0, 5).map((a) => `<li><a href="/articles/${a.slug}/">${esc(a.title)}</a><small>${fmt(a.date)}</small></li>`).join("")}</ul></section>` : ""}<section class="box"><h2>Topics</h2><ul class="list">${cats.map((c) => `<li><a href="/category/${c.slug}/">${esc(c.name)}</a><small>${c.list.length} ${c.list.length === 1 ? "article" : "articles"}</small></li>`).join("")}</ul></section></aside>`;
const lay = (main, o = {}) => `<div class="w lay${o.flat ? " flat" : ""}"><div class="main">${main}</div>${side(o.ex)}</div>`;
const hero = (o) => `<section class="hero${o.image ? "" : " noimg"}">${o.image ? `<img src="${esc(o.image)}" alt="${esc(o.alt || "")}" fetchpriority="high">` : ""}<div class="w hero-in">${o.tagHtml || ""}<${o.el}>${o.href ? `<a href="${o.href}">${esc(o.title)}</a>` : esc(o.title)}</${o.el}>${o.sub ? `<p class="sub">${esc(o.sub)}</p>` : ""}</div></section>`;

function page(o) {
  const t = esc(o.title), im = o.image ? (isUrl(o.image) ? o.image : SITE + o.image) : "";
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${t}</title><meta name="description" content="${esc(o.desc)}">${VERIFY ? `<meta name="google-site-verification" content="${esc(VERIFY)}">` : ""}<link rel="canonical" href="${SITE}${o.url}"><meta property="og:type" content="${o.type || "website"}"><meta property="og:site_name" content="${NAME}"><meta property="og:title" content="${t}"><meta property="og:description" content="${esc(o.desc)}"><meta property="og:url" content="${SITE}${o.url}">${im ? `<meta property="og:image" content="${esc(im)}">` : ""}<meta name="twitter:card" content="${im ? "summary_large_image" : "summary"}"><link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wght@500;700;800&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;1,8..60,400&display=swap"><link rel="stylesheet" href="/style.css">${o.ld ? '<script type="application/ld+json">' + JSON.stringify(o.ld) + "</script>" : ""}</head><body>${head()}<main>${o.body}</main>${foot()}</body></html>`;
}
function write(p, html) { const f = path.join(OUT, p, "index.html"); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, html); }

// ---------- build ----------
fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT, { recursive: true });
fs.cpSync(STATIC, OUT, { recursive: true, filter: (s) => { const b = path.basename(s); return !b.startsWith("_") && !b.startsWith("."); } });

const widget = `<section class="today panel"><h2>MLS matches today</h2><div id="mls"><p>Loading today's matches…</p></div><p class="src">Scores from ESPN's public feed; times in your time zone. <a href="${KP}/mls-live-scores/" rel="noopener">See all MLS live scores on KickPulse</a>.</p></section><script>fetch("https://site.api.espn.com/apis/site/v2/sports/soccer/usa.1/scoreboard").then(r=>r.json()).then(d=>{var e=d.events||[],h="";e.slice(0,12).forEach(function(v){var c=(v.competitions||[{}])[0].competitors||[],a=c[0],b=c[1],s=v.status.type;if(!a||!b)return;h+='<div class="g"><span>'+(s.state==="pre"?new Date(v.date).toLocaleString([],{weekday:"short",hour:"2-digit",minute:"2-digit"}):s.shortDetail)+'</span><b>'+a.team.displayName+'</b><i>'+(s.state==="pre"?"vs":a.score+" - "+b.score)+'</i><b>'+b.team.displayName+'</b></div>'});document.getElementById("mls").innerHTML=h||"<p>No MLS matches on the schedule right now. Check the articles below for previews.</p>"}).catch(function(){document.getElementById("mls").innerHTML="<p>Live scores are unavailable right now. Try <a href=\"https://kickpulse-football.vercel.app/mls-live-scores/\">MLS live scores on KickPulse</a>.</p>"})</script>`;

// Home
const f0 = arts[0];
write("", page({
  title: `${NAME} | MLS previews, team news and match analysis`, desc: "MLS match previews, predicted lineups, team news, injury updates and match analysis, written for fans. Updated through the season.", url: "/",
  body: (f0 ? hero({ image: f0.image, alt: f0.imageAlt, tagHtml: `<a class="tag" href="/category/${slug(f0.cat)}/">${esc(f0.cat)}</a>`, el: "h2", title: f0.title, href: `/articles/${f0.slug}/`, sub: f0.desc }) : hero({ el: "h2", title: NAME })) +
    lay(`<section class="panel intro"><h1>MLS previews, team news and match analysis</h1><p>Match previews, predicted lineups, team news and injury updates for Major League Soccer, in plain English.</p></section><section class="panel kpbox"><h2>Read here, follow the match on KickPulse</h2><p>Pitchside Notes is the blog: previews, team news and what is happening around each match. Our sister site <a href="${KP}/" rel="noopener">KickPulse</a> is where you follow the games live, with scores, kick-off times in your time zone, events, stats and lineups.</p><p class="kpl2">${kpLinks()}</p></section>${widget}<section><h2 class="more">Latest articles</h2><div class="grid">${arts.slice(0, 12).map(card).join("")}</div></section>`),
  ld: { "@context": "https://schema.org", "@type": "WebSite", name: NAME, url: SITE + "/" }
}));
// All articles + categories
write("articles", page({ title: `All articles | ${NAME}`, desc: "Every MLS preview, team news guide and analysis piece published on " + NAME + ".", url: "/articles/", body: lay(`<section class="panel intro"><h1>All articles</h1></section><div class="grid">${arts.map(card).join("")}</div>`, { flat: true }) }));
for (const c of cats) write("category/" + c.slug, page({ title: `${c.name} | ${NAME}`, desc: `${c.name}: all ${NAME} articles on this topic.`, url: `/category/${c.slug}/`, body: lay(`<section class="panel intro"><h1>${esc(c.name)}</h1></section><div class="grid">${c.list.map(card).join("")}</div>`, { flat: true }) }));
// Articles
for (const a of arts) {
  const rel = [...arts.filter((x) => x !== a && x.cat === a.cat), ...arts.filter((x) => x !== a && x.cat !== a.cat)].slice(0, 3);
  const toc = a.toc.length >= 3 ? `<nav class="toc" aria-label="In this article"><b>In this article</b><ol>${a.toc.map((x) => `<li><a href="#${x.id}">${esc(x.text)}</a></li>`).join("")}</ol></nav>` : "";
  const body = hero({ image: a.image, alt: a.imageAlt, tagHtml: `<a class="tag" href="/category/${slug(a.cat)}/">${esc(a.cat)}</a>`, el: "h1", title: a.title }) +
    lay(`<article class="post panel"><p class="meta"><time datetime="${a.date}">${fmt(a.date)}</time><span>${a.min} min read</span><span>By ${esc(a.author)}</span></p>${toc}<div class="body">${a.html}</div><aside class="cta"><b>Follow the match live</b><p>Open <a href="${KP}/mls-live-scores/" rel="noopener">MLS live scores today</a> on KickPulse, check the <a href="${KP}/mls-schedule/" rel="noopener">MLS schedule</a>, see <a href="${KP}/mls-on-tv/" rel="noopener">how to watch MLS on TV</a>, follow the <a href="${KP}/mls-playoffs/" rel="noopener">MLS playoffs matches today</a>, or check the <a href="${KP}/inter-miami-live-score/" rel="noopener">Inter Miami live score</a>.</p></aside></article>${rel.length ? `<section><h2 class="more">Keep reading</h2><div class="grid">${rel.map(card).join("")}</div></section>` : ""}`, { ex: a.slug });
  write("articles/" + a.slug, page({ title: `${a.title} | ${NAME}`, desc: a.desc, url: `/articles/${a.slug}/`, image: a.image, type: "article", body,
    ld: { "@context": "https://schema.org", "@type": "Article", headline: a.title, description: a.desc, datePublished: a.date, dateModified: a.date, ...(a.image ? { image: [SITE + a.image] } : {}), author: { "@type": "Organization", name: NAME }, mainEntityOfPage: SITE + "/articles/" + a.slug + "/", publisher: { "@type": "Organization", name: NAME } } }));
}
// About, privacy
const plain = (h, inner) => lay(`<article class="post panel"><h1 class="ph1">${h}</h1><div class="body">${inner}</div></article>`, { flat: true });
write("about", page({ title: `About ${NAME}`, desc: "Who writes " + NAME + " and how we cover Major League Soccer.", url: "/about/", body: plain(`About ${NAME}`, `<p>${NAME} publishes match previews, predicted lineups, team news and analysis for Major League Soccer. Every article is written by us. Where we use facts from official club or league announcements, we put them in our own words.</p><p>We are an independent fan site and are not affiliated with Major League Soccer, its clubs, or any broadcaster. Predictions are opinions for entertainment only, and nothing here is betting advice.</p><p>Looking for scores instead of articles? Our sister site <a href="${KP}/" rel="noopener">KickPulse</a> has live football scores. Read the blog here for previews and team news, then follow the game on KickPulse: <a href="${KP}/mls-live-scores/" rel="noopener">MLS live scores today</a>, <a href="${KP}/mls-schedule/" rel="noopener">MLS schedule</a>, <a href="${KP}/mls-on-tv/" rel="noopener">MLS on TV</a>, <a href="${KP}/mls-playoffs/" rel="noopener">MLS playoffs matches today</a> and <a href="${KP}/inter-miami-live-score/" rel="noopener">Inter Miami live score</a>.</p><p>Spotted a mistake? Tell us and we will correct it.</p>`) }));
write("privacy-policy", page({ title: `Privacy policy | ${NAME}`, desc: "How " + NAME + " handles visitor data.", url: "/privacy-policy/", body: plain("Privacy policy", `<p>${NAME} does not ask visitors for personal information. The site may use privacy-friendly analytics to count visits, and, if advertising is added later, Google AdSense may use cookies. Fonts are loaded from Google Fonts. We will update this page if any of this changes.</p><p>The live match box loads scores from ESPN's public feed in your browser.</p>`) }));
// sitemap + robots
const urls = [["/", ""], ["/articles/", ""], ["/about/", ""], ["/privacy-policy/", ""]].concat(cats.map((c) => [`/category/${c.slug}/`, c.list[0].date])).concat(arts.map((a) => [`/articles/${a.slug}/`, a.date]));
fs.writeFileSync(path.join(OUT, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map(([u, d]) => `<url><loc>${SITE}${u}</loc>${d ? `<lastmod>${d}</lastmod>` : ""}</url>`).join("")}</urlset>`);
if (!fs.existsSync(path.join(OUT, "robots.txt"))) fs.writeFileSync(path.join(OUT, "robots.txt"), `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`);

// feed for KickPulse (latest articles shown there automatically)
fs.writeFileSync(path.join(OUT, "articles.json"), JSON.stringify({ site: SITE, updated: new Date().toISOString(), articles: arts.slice(0, 12).map((x) => ({ title: x.title, url: SITE + "/articles/" + x.slug + "/", date: x.date, category: x.cat, description: x.desc })) }));
console.log("Built " + arts.length + " articles");
if (warn.length) { console.log("\n=== CHECK THESE " + warn.length + " THINGS (the site still built) ==="); warn.forEach((w) => console.log(" - " + w)); }
else console.log("No problems found.");
