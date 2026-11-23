// IndexNow: tells Bing (and other IndexNow search engines such as Yandex, Seznam, Naver) that your pages are new or changed.
// It does NOT work for Google. Google uses your sitemap and Search Console instead.
//
// HOW TO USE (needs Node.js 18 or newer on your computer; run it AFTER Vercel shows "Ready"):
//   node indexnow.js                      -> sends every address from your LIVE sitemap
//   node indexnow.js /articles/my-new-article/  /articles/other/   -> sends only these addresses
//
// The key lives in indexnow-key.txt. build.js copies it to https://kickpulse-final.vercel.app/<key>.txt
// so the search engines can check the request really comes from you. Never change the key without redeploying.
const fs = require("fs"), path = require("path");
const SITE = "https://kickpulse-final.vercel.app", HOST = new URL(SITE).host;
const KEY = fs.readFileSync(path.join(__dirname, "indexnow-key.txt"), "utf8").trim();

(async () => {
  if (typeof fetch !== "function") { console.log("Please install Node.js 18 or newer (nodejs.org)."); return; }
  const keyCheck = await fetch(`${SITE}/${KEY}.txt`).then((r) => (r.ok ? r.text() : "")).catch(() => "");
  if (keyCheck.trim() !== KEY) { console.log(`The key file ${SITE}/${KEY}.txt is not live yet. Deploy first, wait for "Ready", then run this again.`); return; }
  let urls = process.argv.slice(2).map((u) => (u.startsWith("http") ? u : SITE + (u.startsWith("/") ? u : "/" + u)));
  if (!urls.length) {
    const xml = await fetch(`${SITE}/sitemap.xml`).then((r) => r.text());
    urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  }
  urls = urls.filter((u) => u.startsWith(SITE)).slice(0, 10000);
  if (!urls.length) { console.log("No addresses to send."); return; }
  const res = await fetch("https://api.indexnow.org/indexnow", { method: "POST", headers: { "Content-Type": "application/json; charset=utf-8" }, body: JSON.stringify({ host: HOST, key: KEY, keyLocation: `${SITE}/${KEY}.txt`, urlList: urls }) });
  const msg = { 200: "OK - received.", 202: "Accepted - the key will be checked, this is normal the first time.", 400: "Bad request - something in the list is wrong.", 403: "Key not valid - check the key file is live.", 422: "Addresses do not belong to this site.", 429: "Too many requests - wait and try again tomorrow." }[res.status] || "";
  console.log(`Sent ${urls.length} addresses. Answer: ${res.status} ${msg}`);
})().catch((e) => console.log("Could not send: " + e.message));
