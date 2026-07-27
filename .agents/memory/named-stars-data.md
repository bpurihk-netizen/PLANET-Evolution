---
name: Named stars astronomical data
description: Where star distance/magnitude data lives and how to extend it
---

## Rule
`STAR_ASTRO_DATA` in `src/data/namedStars.ts` is a Record<nameEn, {distanceLy, magnitude}> lookup for ~40 major stars (Hipparcos/SIMBAD values). `NamedStarEntry` has optional `distanceLy?` and `magnitude?` fields but the canonical source is the lookup table.

## How to apply
- StarNamePopup uses `STAR_ASTRO_DATA[star.nameEn]` to show distance/magnitude widget.
- To add a new star's data, add an entry to `STAR_ASTRO_DATA` keyed by the exact English name string used in `nameEn` field.
- The `NamedStarEntry` optional fields remain unused for now; prefer the lookup table to avoid editing every data entry.
