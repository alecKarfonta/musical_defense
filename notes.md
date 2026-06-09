# Glorp Busters — project notes

## Current goal
Leaderboard with localStorage persistence + classic arcade HIGH SCORES panel; initials entry on qualifying runs.

## Leaderboard
- Top 10 by score in `localStorage` key `glorpBustersLb`; merged with YouTube `loadData` on boot
- Upper-right panel on `#cvbox` (18px inset) when title/game-over overlay is up; hidden during play
- Qualifying score → 3-letter initials (↑↓ cycle, ←→ move, Space/OK to confirm); blinks on table when saved

## Previous goal
Late-game difficulty (wave 12+): coasting 12–30 without spending credits — ramp HP, spawn density, elites, speed after wave 11; early acts unchanged.

### Difficulty scaling (wave 12+)
- `hpMul`: extra ×(1+7.5%/wave)×1.07^t after wave 11
- `eliteChance`: up to ~34% by wave 30 (was capped 16%)
- `buildWave`: +12% enemy count / wave, −6% spawn gap / wave, extra brood/chonk on boss & filler waves
- Enemy speed: +1.4%/wave after wave 11

## Music fixes (broken FULL audio)
- **Delay pitch warp**: `audio()` was retargeting delay time on every SFX call → moved to `reanchor()` only
- **KS bass pile-up**: Karplus-Strong feedback loops stacked 4×/bar into mud → `bassNote()` triangle plucks
- **Clock bunching**: `whenAtBeat()` returned 0 when `useAC` false → fallback from `beatClock`; groove no longer gated on `useAC`
- **Duck**: only pads now (not bass bus); reduced kill-run delay send
- AC `resume()` awaited on game start before `reanchor()`

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
