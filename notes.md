# Glorp Busters — project notes

## Current goal
Maintain modular glorp-busters layout (no version suffix in filenames).

## Done
- Extracted CSS to `glorp-busters.css`
- Extracted JS to `glorp-busters.js`
- Extracted icons to `glyphs/*.svg` (13 files) + `glorp-glyphs.js` loader
- `glorp-busters.html` — markup only, links CSS + JS

## Run / verify
```bash
docker compose up -d --build
open http://localhost:8888/glorp-busters.html
```

## Repo
Initialized git repo with split file layout + docker-compose static server.
