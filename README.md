# Glorp Busters

Tower defense game with rhythm-synced turrets. VoltWorks pest control experience.

## Run locally

```bash
docker compose up -d
```

Open [http://localhost:8888/glorp-busters-v7.html](http://localhost:8888/glorp-busters-v7.html)

## Project layout

| Path | Description |
|------|-------------|
| `glorp-busters-v7.html` | Page markup |
| `glorp-busters-v7.css` | Styles |
| `glorp-busters-v7.js` | Game logic |
| `glorp-glyphs.js` | SVG icon loader |
| `glyphs/` | Icon SVG assets |

Glyphs load via `fetch()` — serve over HTTP (Docker or any static server).

## YouTube Playables

Uncomment the YouTube Game API script tag in `glorp-busters-v7.html` before deploying.
