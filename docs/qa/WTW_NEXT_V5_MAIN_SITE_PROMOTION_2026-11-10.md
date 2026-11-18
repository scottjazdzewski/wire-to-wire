# WTW Next v5 — Main-site promotion

**Date:** November 10, 2026

**Promoted homepage:** `https://wire-to-wire.pages.dev/`

## What changed
- Production `public/index.html` now uses the **exact validated `/next/` v5 interface**, minus the review-only noindex meta tag and with the production Racing Office title.
- The root loads **one** stylesheet `/next/next.css` and the next-gen adapter `/next/next.js`. No extra CSS layer is loaded.
- Original v30 decision engine and subsequent canonical route/state scripts remain linked; **no game-data or save-format migration**.
- The reviewed `/next/` path remains available.
- The historical `/archive/` remains linked and untouched; all approved v2 badge images remain deployed.

## Validation
- Root-to-review HTML equivalence test, one-stylesheet assertion, preserved archive and engine, badge validation, JS syntax in GitHub CI.
- v5 1093–1366px local browser render and genuine decision, stable and race calendar checks completed during candidate review.
- **Separate pending check:** real Cloudflare Pages deployment, authenticated browser Save/Load and historical deep-link refresh still need in-origin verification.

## Rollback
Pre-promotion code is recoverable from commit `0cdb836e74fed17048634117d46ff03391fffa8b`. Do not write new legacy duplicate pages into source.
