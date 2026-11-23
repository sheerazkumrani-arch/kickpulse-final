# Proposal 4: one Seattle Sounders vs Real Salt Lake preview, not two

Articles: `seattle-sounders-vs-real-salt-lake-prediction.md` (16 Nov, about 1,800 words, the stronger one) and
`seattle-sounders-vs-real-salt-lake-mls-scores-kickoff-preview.md` (20 Nov, about 950 words). Same match, same search.
Your report says: Seattle 1-1 Real Salt Lake, RSL won 4-2 on penalties.

## Keep
`seattle-sounders-vs-real-salt-lake-prediction` (longer, has FAQ, tactics and form).

## Redirect
```json
{ "source": "/articles/seattle-sounders-vs-real-salt-lake-mls-scores-kickoff-preview{/}?", "destination": "/articles/seattle-sounders-vs-real-salt-lake-prediction/", "permanent": true }
```
and `draft: true` in the kickoff-preview file.

## Move into the kept article
- "Old Friends, New Colours" (players who played for both clubs) - this is original angle, keep it.
- "Tactical Battle: Control vs Counter".

## Add at the top of the kept article
```markdown
:::next Result: Seattle 1-1 Real Salt Lake (RSL win 4-2 on penalties)
This preview was written before the Wild Card match. Read what happened in our [match report](/articles/real-salt-lake-beat-seattle-sounders-penalties-match-report/).
[YOUR VIEW: was the prediction right? One honest sentence.]
:::
```
Top block: shorter title `seo_title: Seattle vs Real Salt Lake prediction, team news and lineups`, `updated: [VERIFY]`, `competition: MLS`.
