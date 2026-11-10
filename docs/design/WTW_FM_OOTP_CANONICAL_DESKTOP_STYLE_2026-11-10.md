# WTW — Canonical Desktop Visual Design (FM / OOTP Inspired)
**Locked UI authority:** November 10, 2026
**Implementation:** The playable Office uses exactly one canonical `public/next/next.css` (both `/` and `/next/`). The independent History Vault uses exactly one canonical `public/style.css` (`/archive/`). Both have been rebuilt in place to the same palette and design principles; neither loads an override sheet.
**Scope:** Whole game — Racing Office, all department landing pages, Global Search, Horse and People Profiles, Farms, Tracks, Organizations, race/season history, deeper connected tabs and management workflows.

## Governing principle
A desktop racing **management simulation**, not a card-based website. Apply Football Manager and Out of the Park Baseball's useful patterns: sharply aligned dense tables, easily scanned roster information, fast back/forward, compact filters, identity crests/portraits, meaningful category accents, minimal page chrome and screens that explain themselves without excess drilling. Do not reproduce their copyrighted artwork or skins. WTW keeps its approved logos, photographic editorial assets, racing terminology, forest-green highlights and warm racing gold.

## One system, no patches
- Each application has **one authoritative stylesheet**: the game `/next/next.css`, and the independent History Vault `/style.css`. Neither should import a second layer or append dated "fix" sections. Do **not** create `override.css`, a second `<style>` block, or inline CSS overrides.
- When changing a component, **edit its existing consolidated selector in the authoritative file**, remove obsolete declarations, and update the relevant responsive condition in the same file. Shared widgets belong to shared classes and tokens, not page-specific clones.
- Both rebuilt stylesheets consolidate repeated selectors by selector/media context. `tests/ui-canonical-style.test.mjs` guards against duplicate rule blocks, checks the two dark palettes, and protects the existing screen structures.
- The prior CSS is recoverable from Git history; there is no parallel styling authority.
- Don't change gameplay engines, horse generation, canonical people/horse histories, official records or save namespaces to achieve a visual appearance.

## Palette and chromatic hierarchy
| UI role | Token / base color | Use |
|---|---|---|
| Overall canvas | `--wt-bg: #0b1014` | Full browser surface; not green |
| Application chrome | `--wt-shell: #10161a` | Top bar, navigation |
| Standard panels | `--wt-card: #191f23` | Decision Desk, roster, profile cards |
| Raised/alternating rows | `--wt-row2: #252d30` | Tables, active focus contexts |
| Lines | `--wt-line: #3a4644` | Thin dividers; avoid heavy outlined boxes |
| Main text | `--wt-text: #eef1ef` | Names and primary data |
| Brand green | `--wt-forest: #244d3d` | Active sections, functional accents, buttons |
| Secondary positive green | `--wt-green: #60bd93` | Verified positive states only |
| Heritage gold | `--wt-gold: #dcc487` | Editorial headings, selected state, important values |
| Risk red | `--wt-red: #ca5061` | Cautions, time pressure, Continue/navigation emphasis |

Most of the screen must read as charcoal/slate. Green indicates racing identity, state or action; it must not be a large solid panel background. Gold is selective, not used for every cell. Avoid colored tiles for decorative filler.

## Density and geometry
- **Desktop-first; 1366×768 is the primary test viewport** (also inspect 1280×800 and 1440×900).
- Front page: compact one-line global header, dense inbox, full-width dossier and contextual photograph, balanced Intelligence/Your Call row, fixed Stable Roster/Race Schedule.
- First-tier Overview: all consequential information visible without scrolling or extra clicks. Detailed history may scroll **inside explicit secondary tabs**; main Overviews do not.
- Panel headings should share a common compact height and baseline (roughly 32–36px). Table rows should generally be 27–32px high unless descriptive source text truly needs more.
- Use dark alternating row backgrounds; left-align names/descriptions, right-align numerics, center status badges/icons/controlled columns. Set tabular numerals for financial/date figures.
- Avoid gigantic titles, rounded cards, thick decorative borders, unnecessary gradients and duplicated breadcrumb/section headers.
- Do not clip relevant records; use pagination, controlled internal tables, or deeper linked tabs for overflow, not an ever-growing parent scroll.
- On Horse, People and other profiles, retain the approved standalone identity shields and genuine sourced imagery when present. Never invent portraits, owners, scores or capabilities.

## Reusable navigation and identity
- Back and Forward follow visited pages; global Search is the same sortable, filtered, pagination-aware directory for available entities and game screens.
- Names always have the same linked behavior. Horses show the real owner's crest when an approved owner mapping exists, or an accessible neutral unknown-owner mark; trainers and barns are never silently treated as owners.
- Professions use consistent title case (Stable Staff, Bloodstock Agent, Farm Manager).
- Flag/geography data follows canonical location sources, not presumed nationality.
- Every first-tier panel includes its primary facts, actions and context immediately; deep tabs supplement rather than conceal the overview.

## Archive-specific continuity
- History Vault keeps its standalone historical data/navigation system, but its prior light/cream canvas, oversized cards and serif-heavy decorative spacing have been rebuilt to the same charcoal/green/gold management standard.
- Its Return-to-Racing-Office link now uses a canonical class; no inline styling remains in `public/archive/index.html`.
- Keep the two applications' technical CSS separated by runtime but visually consistent. No gameplay/data changes or new data authorities.

## Approval process
1. Modify the canonical selector(s), not append a patch.
2. Run stylesheet structural and route-specific regressions, plus JavaScript syntax checks.
3. Confirm Cloudflare deployment, then inspect screenshots on desktop at common widths.
4. Approve main Racing Office and each Tier 1 entity screen before descending into Tier 2.
5. A green CI run is **not** equivalent to a verified visual screenshot sign-off.

This document supersedes earlier visual experimentation, old dated CSS pass comments and screenshot-specific patch guidance. It does not supersede gameplay/data authorities.
