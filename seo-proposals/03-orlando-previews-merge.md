# Proposal 3: one Orlando City vs FC Cincinnati preview, not two

Articles: `orlando-city-vs-fc-cincinnati-preview.md` (17 Nov) and `orlando-city-vs-fc-cincinnati-wild-card-preview.md` (19 Nov).
Both preview the same Wild Card match on 19 November 2026. The match is over: your report says Orlando City 1-3 FC Cincinnati.

## Keep
`orlando-city-vs-fc-cincinnati-preview` (old addresses already redirect to it in vercel.json).

## Redirect the other one
```json
{ "source": "/articles/orlando-city-vs-fc-cincinnati-wild-card-preview{/}?", "destination": "/articles/orlando-city-vs-fc-cincinnati-preview/", "permanent": true }
```
and put `draft: true` in `orlando-city-vs-fc-cincinnati-wild-card-preview.md`.

## Move these parts from the wild-card preview into the kept preview
- "Match Details and Global Kickoff Times" table (more countries).
- "How the MLS Wild Card Round Works".
- "Three Storylines to Watch".

## Add at the very top of the kept preview (right after the top block)
```markdown
:::next Result: Orlando City 1-3 FC Cincinnati
This preview was written before the match. FC Cincinnati won 3-1 in Orlando and moved on to face Nashville SC. Read the full [Orlando City 1-3 FC Cincinnati match report](/articles/orlando-city-1-3-fc-cincinnati-wild-card-report/).
[YOUR VIEW: one sentence - what did the preview get right or wrong? Being honest about this builds trust.]
:::
```
And in the top block: `updated: [VERIFY today's date]`, `competition: MLS`, `time: [VERIFY]`.
