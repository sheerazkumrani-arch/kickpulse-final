# Proposal 1: merge three MLS "scores" guides into one

## Why
- `mls-scores-today-live-results-guide` (about 740 words), `major-league-soccer-live-scores-scoreboard-guide` (about 730) and `mls-matches-today-games-tonight-guide` (about 720) answer almost the same question: "where and how do I see MLS scores/games today?"
- They have no data of their own and mostly send the reader to KickPulse. For a new site, Google often decides such pages add little value ("Crawled - currently not indexed").
- One complete guide is easier for Google to trust than three thin ones.

## Keep
`mls-scores-today-live-results-guide.md` (the clearest title). Redirect the other two to it.

```json
{ "source": "/articles/major-league-soccer-live-scores-scoreboard-guide{/}?", "destination": "/articles/mls-scores-today-live-results-guide/", "permanent": true },
{ "source": "/articles/mls-matches-today-games-tonight-guide{/}?", "destination": "/articles/mls-scores-today-live-results-guide/", "permanent": true }
```
(Add these inside "redirects" in vercel.json, and put `draft: true` in the two old files.)

## New top block
```yaml
---
title: MLS scores today: how to follow results and kickoff times from Pakistan
seo_title: MLS scores today: results and kickoff times from Pakistan
description: How to follow MLS scores today from Pakistan, the UK or Europe: what HT and FT mean, how the two conferences work, and kickoff times in PKT.
date: 2026-11-17
updated: [VERIFY: the day you publish this update]
time: [VERIFY]
category: Guides
competition: MLS
key_takeaways: Most MLS kickoffs are listed in US Eastern time | A 7:30 pm ET kickoff is 5:30 am PKT in winter and 4:30 am PKT in summer | MLS has two conferences, East and West, and the table decides playoff places
what_next: [YOUR VIEW: one or two sentences, e.g. which MLS games you will be watching next and why]
faq: What time are MLS games in Pakistan? :: Most evening games (7:30 pm ET) start between 4:30 am and 5:30 am PKT the next morning, depending on US daylight time. West Coast games start about three hours later. || What does FT mean on a live score? :: FT means full-time: the match is finished and the score is final. HT means half-time.
---
```
(The kickoff facts above come from your article mls-kickoff-times-pakistan-uk-europe.)

## New structure (use the best paragraphs from the three old guides)
1. Short answer (2-3 lines, what the reader came for).
2. `:::stats Kickoff times for a 7:30 pm ET game` -> copy the conversion table from your kickoff-times article. `:::`
3. What the match labels mean (from mls-scores-today: minute, HT, FT, kickoff time).
4. Why MLS has two conferences and how the table leads to the playoffs (from the scoreboard guide).
5. How many games to expect on a normal weekend vs playoff time (from the matches-today guide). [VERIFY numbers]
6. `:::analysis` **[YOUR VIEW]**: your own routine as a fan in Pakistan following games at 5 am. This personal, original part is what makes the page different from every other "MLS scores" page. `:::`
7. Links to your real match reports (Revolution 2-0 Union, Real Salt Lake on penalties, Orlando City 1-3 FC Cincinnati).
8. FAQ (filled from the `faq:` line above).
