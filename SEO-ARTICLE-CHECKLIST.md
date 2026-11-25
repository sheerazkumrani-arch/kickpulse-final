# Pitchside Notes: article checklist (use for EVERY new article)

Google indexes pages that add something new. A new site with many "news repeat" pages often gets "Crawled - currently not indexed".
So every article needs at least ONE original element that only you provide.

## 1. Choose a long-tail keyword (10 minutes)
A long-tail keyword is a longer, more exact search (4-8 words). Fewer sites compete for it, so a new site has a real chance.
- Broad (too hard): "Manchester United news", "MLS scores".
- Long-tail (good): "Pochettino Man United debut tactics Anfield", "Liverpool 4-0 Man United player ratings Yoro red card",
  "MLS playoffs kickoff time Pakistan", "Alcoyano vs Mallorca Copa del Rey extra time goals", "Norway vs England Nations League quarter-final dates".

Simple method:
1. Type the match or topic into Google. Write down the "People also ask" questions and the suggestions at the bottom ("Related searches").
2. Pick ONE main phrase that is exact (teams + what: tactics / ratings / kickoff time PKT / head to head / what next).
3. Check the first results: if they are all giant sites (BBC, ESPN, Sky) for a broad phrase, make it more exact (add "PKT", "tactics", "player ratings", "record", a player's name).
4. Use the phrase in: the title, the description, the first 100 words, one `##` heading. Once each is enough. Never repeat it unnaturally.
5. Use the "People also ask" questions as your FAQ (only real questions, answered honestly).
6. After 2-4 weeks, Search Console > Performance > Queries shows what people really searched. Use those words when you update the article.

## 2. Original element (at least one, two is better)
- [ ] Your own analysis or opinion (`:::analysis` box). Say clearly what YOU think and why.
- [ ] A data table: form, head-to-head, stats (`:::stats` box with a Markdown table). Check every number at the source.
- [ ] Tactical explanation (formation, key battle, what changed).
- [ ] Key players to watch (`:::players` box).
- [ ] Timeline (`:::timeline`) for match reports.
- [ ] "What this means next" (`what_next:` line).
- [ ] Kickoff time in PKT / UK / Europe (your readers' special need).

## 3. Top block
```yaml
---
title: Exact, human title (55-65 characters is ideal)
seo_title: optional shorter title for Google
description: 120-155 characters. Say what the reader gets.
date: 2026-11-24
time: 18:30            # Pakistan time. Needed so same-day articles are in the right order.
updated: 2026-11-25    # only when you really change the article
category: Match previews   # or Match reports, Analysis, Guides
competition: Premier League   # optional, the build guesses it
image: /images/file-name.jpg
imageAlt: What the picture shows
key_takeaways: point one | point two | point three
what_next: One or two sentences.
faq: Question one? :: Answer one || Question two? :: Answer two
translation: slug-of-the-french-or-urdu-version
---
```

## 4. Boxes you can use inside the article
```markdown
:::stats Last five meetings
| Date | Match | Score |
|---|---|---|
| ... | ... | ... |
:::

:::analysis
My view: ...
:::
```
Box names: `takeaways`, `stats`, `analysis`, `players`, `timeline`, `next`. Text after the name becomes the box title.

## 5. Facts and honesty
- [ ] Every score, date, quote and number checked at an official or trusted source. Add a short "Sources" list.
- [ ] AI tools may help with drafting, but you read every line, check every fact and add your own view before publishing.
- [ ] Prediction pages: after the match, add a `:::next Result: ...` box and an `updated:` date.
- [ ] Do not publish two articles for the same search (for example two previews of the same match). Update the first one instead.

## 6. Before you upload
- [ ] `node build.js` ends with no SEO errors.
- [ ] Link to 2-3 of your own related articles inside the text.
- [ ] After deploy: Search Console > URL Inspection > Request indexing (for your best new article).

## Publishing rhythm (quality over quantity)
For the next 2-3 months: **3 to 4 strong articles per week** (at least 900-1,200 words with one original element), not several thin ones per day.
Plus: update 1-2 older articles per week (result boxes, better FAQ, fixed facts). Updating is as valuable as publishing.


## Before you publish a match preview (new)
- [ ] Add `home_team:`, `away_team:` and `kickoff:` (for example `2026-11-19T05:30+05:00`). The build then adds match schema by itself.
- [ ] Add `time:` (Pakistan time) when another article has the same date.
- [ ] Keep `seo_title:` at 60 characters or fewer.
- [ ] Add 2-3 real questions with `faq:`.
- [ ] After the match: add the result at the top and an `updated:` date.
