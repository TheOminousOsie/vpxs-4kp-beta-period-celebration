# Table Manager — Beta Wrap microsite

A static, three-page site celebrating Table Manager's exit from beta. Built from
the design handoff in `dev/Website mockup for vpxtablemanager.com/` and real data
in `dev/`. Plain HTML/CSS/JS — no build step, no framework.

## Running it locally

Because the Catalog page fetches per-table commit history as JSON, you need to
serve the folder over HTTP (not open `index.html` directly — `fetch()` is
blocked under `file://`).

```powershell
powershell -ExecutionPolicy Bypass -File scripts/serve.ps1 -Port 8080
```

Then open http://localhost:8080/. Any other static server works too
(`npx serve`, VS Code Live Server, `python -m http.server`, GitHub Pages,
Netlify, etc.).

## Structure

- `index.html` — the single page shell; three sections (Overview, Catalog
  History, Timeline) toggled by `js/app.js`, matching the handoff's in-page nav.
- `css/style.css` — all design tokens and component styles from the handoff doc.
- `js/app.js` — nav/routing (hash-based), boot sequence.
- `js/charts.js` — renders every chart/leaderboard/KPI strip from `data/site-data.js`.
- `js/catalog.js` — search/letter-filter, accordion rows, and on-demand fetch +
  render of each table's real commit history and diffs.
- `js/fireworks.js` — the hero canvas particle animation.
- `data/site-data.js` — hand-transcribed aggregate figures from the handoff
  README (KPIs, monthly/hourly/weekday charts, contributor & reviewer
  leaderboards, Discord stats, timeline events).
- `data/releases.js`, `data/table_index.js` — generated from `dev/releases.json`,
  `dev/wizard_tables.txt` and `dev/manifest-2.json` (see Data below).
- `data/tables/<slug>.json` — one file per wizard table (315 total) with real
  commit history and diffs, generated from `dev/table_history_with_diffs.json`.
  Fetched lazily when a table row's commit history is expanded.
- `data/table_meta.js` — full curated metadata for all 315 tables (name,
  manufacturer, year, tagline, table/backglass authors, testers, FPS, VPS ids,
  wizard release added), generated from `dev/manifest-2.json`.
- `assets/launchers/<slug>.png` — current launcher art per table (315 files,
  copied from `dev/wizard-launchers/`).
- `assets/launcher-history/<slug>.png` — launcher art history strip per table,
  where one exists (267 of 315, copied from `dev/launcher-history/`).
- `assets/dashboard-preview.png` — the real Overview hero screenshot, copied
  from `dev/dashboard-preview.png`.

## Regenerating the catalog data

If `dev/table_history_with_diffs.json`, `dev/releases.json`,
`dev/wizard_tables.txt`, or `dev/manifest-2.json` change, rebuild with:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/build-table-data.ps1   # splits the big JSON into data/tables/<slug>.json
powershell -ExecutionPolicy Bypass -File scripts/build-table-meta.ps1   # rebuilds data/table_meta.js (tagline, authors, testers, VPS ids...) from manifest-2.json
powershell -ExecutionPolicy Bypass -File scripts/build-table-index.ps1  # rebuilds data/table_index.js (names, manufacturer/year, commit counts, date ranges)
```

## Known gaps vs. the design handoff

- The header logo is a placeholder cyan square, as the handoff specifies until
  a real mark is supplied.
- `assets/` is ~400MB of PNGs — fine for hosting, but consider Git LFS or image
  compression before committing if repo size matters.

All 315 tables now have full curated metadata (from `dev/manifest-2.json`) and
real commit history with diffs (from `dev/table_history_with_diffs.json`) — no
"not yet imported" placeholders remain in the catalog.
