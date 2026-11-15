PITCHSIDE NOTES - how to use (English site for MLS previews and team news)

ADD AN ARTICLE (daily)
1. Copy content/_TEMPLATE-match-preview.md, rename it, e.g. content/inter-miami-vs-orlando-city-preview.md (file name = web address).
2. Change title, description, date (YYYY-MM-DD) and write the article in your own words.
3. Upload/deploy the project again. Vercel builds the new page and the sitemap by itself.

BEFORE YOU DEPLOY
- Search Console verification (HTML tag method): open build.js, find  const VERIFY = "";  and paste your code between the quotes. The code is the content="..." value of your google-site-verification tag (Search Console > Settings > Ownership verification).
- Deploy this ONLY to the kickpulse-final project. Do not deploy it to kickpulse-football.
- If you change the site address later, edit SITE and NAME at the top of build.js.
- Check that the name "Pitchside Notes" and its domain are free for you before using it long term.

OLD PAGES
vercel.json sends the old KickPulse score pages on this address (league pages, etc.) to the same pages on kickpulse-football.vercel.app with a permanent redirect, so the duplicate disappears.

WRITING RULES
- Write every article yourself, in your own words. Use facts, not other sites' sentences.
- Use free-licence photos or your own graphics. No club logos.
- Predictions are opinions for fun. No odds, no tips, no betting links.

KEYWORDS TO USE (natural sentences, 1 main phrase per article)
Match preview, predicted lineup, team news, injury news, "[Team A] vs [Team B] preview", "[Club] predicted lineup", "[Club] injury news".
Left out on purpose: "over 2.5 goals", "correct score", "home team win". These are betting terms and can cause AdSense and trust problems.
