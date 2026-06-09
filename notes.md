# Glorp Busters — project notes

## Current goal
Split monolithic `glorp-busters-v7.html` into separate files.

## Done
- Extracted CSS to `glorp-busters-v7.css`
- Extracted JS to `glorp-busters-v7.js`
- Extracted icons to `glyphs/*.svg` (13 files) + `glorp-glyphs.js` loader
- `glorp-busters-v7.html` — markup only, links CSS + JS

## Run / verify
```bash
docker compose up -d --build
open http://localhost:8888/glorp-busters-v7.html
```

## Repo
Initialized git repo with split file layout + docker-compose static server.
