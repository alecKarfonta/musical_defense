# Glorp Busters

Tower defense game with rhythm-synced turrets. VoltWorks pest control experience.

## Run locally

```bash
docker compose up -d
```

Open [http://localhost:8888/glorp-busters.html](http://localhost:8888/glorp-busters.html)

## Project layout

| Path | Description |
|------|-------------|
| `glorp-busters.html` | Page markup |
| `glorp-busters.css` | Styles |
| `glorp-busters.js` | Game logic |
| `glorp-glyphs.js` | SVG icon loader |
| `glyphs/` | Icon SVG assets |

Glyphs load via `fetch()` — serve over HTTP (Docker or any static server).

## YouTube Playables

Uncomment the YouTube Game API script tag in `glorp-busters.html` before deploying.
