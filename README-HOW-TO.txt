PITCHSIDE NOTES - how to use (English MLS previews and team news site)

DAILY: ADD AN ARTICLE
1. Copy content/_TEMPLATE-match-preview.md and rename the copy, e.g. content/inter-miami-vs-orlando-city-preview.md
   (small English letters, numbers, dashes only. The file name becomes the web address.)
2. Fill in the top block (title, description, date, category, image, imageAlt) and write the article.
   Delete the line  draft: true  when the article is ready. While it says draft: true the article is NOT published.
3. Put the main picture in static/images/ (1600x900 pixels, under 250 KB) and write its name in "image:".
4. Upload the project. Vercel builds the page, the category pages and the sitemap by itself.

PICTURES
- Top of the file:  image: /images/name.jpg  and  imageAlt: short description   -> big picture at the top
- Inside the article, on its own line:  ![describe the picture](/images/name.jpg "optional caption")
- Capital/small letters must match the real file name exactly (Vercel is case-sensitive).
- Use your own photos, Canva graphics or free-licence sites (Unsplash, Pexels, Pixabay). No club logos, no pictures copied from other sites.
- An article with no image gets a green striped banner, so nothing breaks.

WRITING FORMAT (what works in the .md file)
## Heading     ### Sub-heading     **bold**     *italic*     [link text](https://...)
- bullet list     1. numbered list     > quote     --- divider     tables with | and a |---| line
Do not start the article with a "# Title" line. The title comes from "title:" at the top.

SEARCH CONSOLE VERIFICATION
Create a file named verify.txt next to build.js and paste ONLY the content="..." value of your google-site-verification tag (nothing else, no quotes). It stays there when you replace other files.

CHECK BEFORE YOU DEPLOY
Run:  node build.js   (or just deploy: the same check runs in the Vercel build log).
It prints a list of things to fix: missing description, wrong date format, missing or wrongly spelled image, bad file name, very short article.

DEPLOY ONLY to the kickpulse-final project. Do not deploy this to kickpulse-football.
If you change the site address later, edit SITE and NAME at the top of build.js.

OLD PAGES
vercel.json sends the old KickPulse score pages on this address to the same pages on kickpulse-football.vercel.app with a permanent redirect.

WRITING RULES
- Write every article yourself, in your own words. Use facts, not other sites' sentences.
- Predictions are opinions for fun. No odds, no tips, no betting links.
- Keywords: 1 main phrase per article, in natural sentences:
  "[Team A] vs [Team B] preview", "[Club] predicted lineup", "[Club] injury news", "[Club] team news".
  Left out on purpose: "over 2.5 goals", "correct score", "home team win" (betting terms, AdSense risk).
