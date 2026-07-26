---
name: Shooter Gradius Expansion
description: Architecture decisions and gotchas for the space shooter's Gradius-style expansion (enemies, weapons, items).
---

## New enemy types (14 total)
Original 4: scout, heavy, disc, asteroid
Added 10: bomber, elite, swarm, splitter, carrier, ramjet, sentinel, phantom, crystal, dreadnought

ShooterEntity has optional fields for behavior: spawnTimer, chargeTimer, fireTimer, visibleTimer, visible, charged.

Enemy bullets use `isEnemy: true` on the Bullet type and travel toward the player. Shield/barrier protect against them.

## Weapon ranks (0–14)
Ranks 0-8 unchanged. Ranks 9-14: RIPPLE, BACK FIRE, VULCAN, SCATTER, PLASMA, OMEGA.
All use the same power capsule system (5 capsules = +1 rank).
BulletType union: 'normal'|'twin'|'missile'|'spread'|'laser'|'special'|'ripple'|'backShot'|'vulcan'|'scatter'|'plasma'|'omega'|'mine'

## Item system (GameItem)
gameItemsRef holds GameItem[]. 10 types: shield, bomb, heal, speedBoost, scoreBoost, autoAim, magnet, timeSlow, barrier, overdrive.
Drop rates: dreadnought 50%, carrier 30%, elite 15%, others 8%.
ActiveEffects type exported from hook for HUD display (timer values + barrierHits).
GameItems.tsx renders visual pickups (diamond + torus ring shape per type).

## Touch movement sensitivity
X divisor: 35 (was 80), Y divisor: 48 (was 120), lerp: 0.38 (was 0.2).

## Sun texture
sun_8k.jpg (4096×2048 equirectangular) downloaded from Solar System Scope.
Registered as TEXTURE_FILENAMES['sun'] = 'sun_8k.jpg'. io.jpg also added.
Old sun.jpg (NASA SDO round disk) had UV corner black artifacts → not used.

## TypeScript gotcha
useRef<THREE.Group>(null) returns RefObject<THREE.Group | null>.
Inline sub-components inside a React FC that accept gRef must type it as React.RefObject<THREE.Group | null>, not React.RefObject<THREE.Group>.

**Why:** TypeScript strict null checks distinguish between RefObject<T> (T not null) and RefObject<T | null> (initialized with null). useRef(null) always produces the nullable form.

## Screenshot environment
WebGL context fails in Replit's headless screenshot environment (no GPU). Not a code bug — always verify with TypeScript + HMR logs instead.
