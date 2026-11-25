# Proposal 06: kick-off and publish times (NOT published)

The build log says 19 articles share a date but have no `time:` line, so their order on that day is a guess.
I did not add times, because only you know when you published each one. [VERIFY]

For each article below, add `time: HH:MM` (Pakistan time) when you published it:
inter-miami-playoffs-messi-title-defence, revolution-beat-union-2-0-game-1-match-report, new-england-revolution-vs-philadelphia-union-playoff-preview, real-salt-lake-beat-seattle-sounders-penalties-match-report, seattle-sounders-vs-real-salt-lake-mls-scores-kickoff-preview, alcoyano-1-3-mallorca-copa-del-rey-match-report, orlando-city-vs-fc-cincinnati-wild-card-preview, alcoyano-vs-mallorca-copa-del-rey-preview-prediction, japan-vs-paraguay-international-friendly-preview, major-league-soccer-live-scores-scoreboard-guide, mls-matches-today-games-tonight-guide, mls-scores-today-live-results-guide, nations-league-quarter-finals-2026-27-schedule-dates-teams, orlando-city-vs-fc-cincinnati-preview, singapore-0-7-brazil-highlights-vinicius-jr-hat-trick, singapore-v-brazil-prediction-live-score-time-tickets, germany-vs-netherlands-nations-league-preview, mls-match-preview-checklist, seattle-sounders-vs-real-salt-lake-prediction

## Match schema
For previews of matches that are still to come, add `home_team:`, `away_team:` and `kickoff:` (see README-SEO.md).
For matches already played, this is optional. [YOUR VIEW]

## Two pages with a hand-written schema block
inter-miami-playoffs-messi-title-defence and nations-league-quarter-final-draw-2026-27 contain a `<script>` block. The build ignores it and adds correct schema itself.
You can delete that block from the .md file to remove the warning. Nothing else changes.

## Missing picture
alcoyano-1-3-mallorca-copa-del-rey-match-report needs `static/images/alcoyano-1-3-mallorca-hero-banner.jpg`. Upload it, or change the two `image` paths to a picture you already have. [YOUR VIEW]

## Author line
The same article says `author: "KickPulse Editorial Team"`. The page already shows "Sheeraz Khan" (set in build.js), so readers see your name. You may delete that line to keep things tidy. [VERIFY]
