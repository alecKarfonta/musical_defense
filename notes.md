# Glorp Busters — Notes

## Current goal
Wave-tier music evolution — tone and intensity ramp in later rounds.

## Music tiers (wave)
- **1–8**: D-minor triads, soft triangle pads, sparse bass.
- **9–18**: 7th voicings, octave-doubled pads, ghost snares + lead hooks, saw plucks.
- **19+**: Phrygian/harm-minor progression, denser bass, lead stabs, heavier mix/FX.

## God Hand (player smite)
- Click/tap an enemy on the canvas to deal direct damage (no build mode active).
- L1 damage ~10 (ZAP-R tier), scales `10 * 1.6^(lvl-1)`, max L9 via Hand path.
- Global `RS.stat("dmg")` applies like turrets.
- Cooldown: 0.45s at L1, -0.04s per level, floor 0.22s with grid mods.
- On-beat click (same window as on-beat placement): 2x damage + floater.
- All Hand levels on Sphere Grid **Hand** path (biomass + cores); keystone **WRATH** adds on-beat splash.
- HUD `HAND L# · R&D` opens the grid (no credit upgrades).
- Hits air, ground, phased enemies; plate logic via existing `hurt()`.
- Cooldown duds are silent (no error SFX).

## Sphere Grid depth (latest)
- **Ring 15 Ascension** capstones per path (35 BIO + 4 CORE each).
- **Deep schisms** at ring 8 (second exclusive fork per main path).
- **Side veins** at ring 5–7 (optional 2-node branches rejoining main path).
- **Outer gates** at rings 12–13: Annihilation, Volt Temple, Biofeedback, Plasma Grid.
- Canvas 1800×1080; FIT zoom for full map.
- Cross synergies (gold SYN diamonds) sit in path wedges with curved edges; hidden until a path node on either side is owned. Ring-0 nodes labeled START.

## Tuning knobs
- `GOD_MAX` (9), base dmg (10), dmg scale (1.6), base cd (0.45), cd per level (-0.04), hit padding (+12px), on-beat mult (2x).
- Boss biomass 12; wave clear biomass 3 + `waveBio` stat.
