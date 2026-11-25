# Improvement proposals (NOT published)

These files are only for you to review. build.js does not read this folder, so nothing here goes live.
Nothing in them was invented: facts come from your own existing articles. Anything you must check is marked **[VERIFY]**.
Anything that needs YOUR opinion is marked **[YOUR VIEW]**. Please write those parts yourself, in your own words.

| File | Article(s) | Problem | Proposal |
|---|---|---|---|
| 01-mls-scores-guides-merge.md | mls-scores-today-live-results-guide, major-league-soccer-live-scores-scoreboard-guide, mls-matches-today-games-tonight-guide | Three short, very similar "how to use a live scores page" guides aimed at the same search. Google usually indexes only one of them, or none. | Merge into ONE stronger guide, redirect the other two. |
| 02-mls-team-news-guide.md | mls-team-news-lineups-injuries-guide | Generic advice, no real example, no original data. | Add a worked example from your own match reports + your view. |
| 03-orlando-previews-merge.md | orlando-city-vs-fc-cincinnati-preview, orlando-city-vs-fc-cincinnati-wild-card-preview | Two previews of the same match (same search intent = they compete with each other). Match is over. | Keep one, add a result box, redirect the other. |
| 04-seattle-previews-merge.md | seattle-sounders-vs-real-salt-lake-prediction, seattle-sounders-vs-real-salt-lake-mls-scores-kickoff-preview | Same problem as Orlando. | Keep one, add a result box, redirect the other. |
| 05-singapore-brazil-preview-update.md | singapore-v-brazil-prediction-live-score-time-tickets | Says "the match has not finished" and talks about tickets for a match that is over. Out-of-date pages look low quality. | Turn it into an updated page with the result and a link to your report. |

How to apply a merge safely:
1. Copy the useful parts into the article you keep.
2. Put `draft: true` in the article you remove (do not delete it at first).
3. Add a redirect in vercel.json (example inside each proposal).
4. Add `updated: <today's date>` to the article you keep.
| 06-time-lines-and-schema.md | 19 articles + 3 others | Missing publish times, missing picture, old schema blocks | Small top-block fixes only you can confirm |
