# SEO update (November 2026) – what is new and how to use it

Nothing in the design, fonts, colours, Search Console tag (verify.txt), Vercel Analytics or the home slider was changed.

## Works automatically on every build
| What | Where you see it |
|---|---|
| sitemap.xml made from every page that was built (articles, topics, competitions, archive, author, trust pages), with real `<lastmod>` dates and language links (hreflang) | /sitemap.xml |
| robots.txt allows everything and points to the sitemap | /robots.txt |
| One correct canonical on every page, no noindex anywhere (except the 404 page) | page source |
| Competition pages: /competition/mls/, /competition/premier-league/, /competition/nations-league/ … | footer, sidebar, home page |
| Archive with page numbers (50 links per page), all languages | /archive/ |
| Author page with Person schema, linked from every byline | /author/sheeraz-khan/ |
| 4 related articles at the bottom (same competition / teams first) | every article |
| Real picture sizes (width/height) on every picture | faster, no page jump |
| Wrong picture folder paths are repaired if the file exists in static/images/ | build log tells you |
| Titles: "Title | Pitchside Notes" only when short; your own with `seo_title:` | build log warns if too long |
| Missing `category:` gets a sensible guess (and a warning) | build log |
| 404 page | any wrong address |
| SEO check after every build (seo-check.js) | end of the build log |

## The SEO check
At the end of `node build.js` you see "SEO ERRORS" (serious) and "CHECK THESE" (should fix).
The site still builds. To make Vercel STOP when there is a serious error: Vercel > your project > Settings > Environment Variables > add `SEO_STRICT` = `1`.

## New optional lines in an article's top block
See SEO-ARTICLE-CHECKLIST.md and content/_TEMPLATE-article.md.
`seo_title`, `time`, `updated`, `competition`, `key_takeaways`, `what_next`, `faq`, and boxes inside the text: `:::stats`, `:::analysis`, `:::players`, `:::timeline`, `:::next`, `:::takeaways` … closed with `:::`.

## Trust pages (pages/ folder)
Every .md file in `pages/` becomes a page (see pages/_EXAMPLE-page.md). When `pages/about.md` or `pages/privacy-policy.md` exists it replaces the old built-in page. Footer links appear only for pages that exist.

## IndexNow (Bing and others, NOT Google)
IndexNow is a free "doorbell": you tell Bing "these pages are new or changed", so Bing visits sooner.
- The secret key is in `indexnow-key.txt`. The build puts a copy online at `/<key>.txt` so Bing can check it is really your site. Do not share or change it.
- After Vercel says **Ready**, open a terminal in the project folder and run:
  - `node indexnow.js` → sends every address in your live sitemap (do this once now).
  - `node indexnow.js /articles/new-article-name/` → only the new article (do this after each new article).
- An answer "200" or "202" means it worked. Do not send the full list every day; only new or changed pages.
- No computer with Node.js? That is fine: Bing Webmaster Tools also reads your sitemap by itself, just a bit slower.


## Update 2 (25 November 2026)
| What | Where |
|---|---|
| llms.txt: a short plain-text list of your pages for AI tools (ChatGPT, Gemini, Perplexity). Made automatically at every build. | /llms.txt |
| Match schema (SportsEvent, hidden code that tells Google "this page is about this match"). Added ONLY when an article has all three lines below. | page source |
| SEO check now also warns about: titles over 65 characters, pictures with no alt text, broken schema code, articles under 600 words, missing llms.txt or 404 page. | end of the build log |

Optional match lines for a preview's top block (write the real facts only):
```
home_team: Orlando City
away_team: FC Cincinnati
kickoff: 2026-11-19T05:30+05:00
venue: Inter&Co Stadium
```
`kickoff:` is the start time with the Pakistan offset `+05:00` at the end.
