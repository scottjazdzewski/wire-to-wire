# Wire to Wire — Decision Desk photographic media contract

**Scope:** UI photography only. This does not create or alter the historical corpus, people/horse/farm identities, player state, or racing decisions.

## Current implementation

The Office loads `/assets/office/decision-photo-index.json`. Every decision displays an image and falls back to the already-approved `/assets/office/approved-office-photo.jpg`.

Precedence:
1. `cases[case_id]` (a specific decision-scene photo, where applicable).
2. `entities["type:Name"]` for the associated subject in the current 2014 Office prototype.
3. `categories[category]` for generic approved racing / sales / training / finance / news images.
4. `default` (approved stable image).

All image paths are restricted to actual image assets under `/assets/`, and a missing or broken image falls back to the approved generic photo. No shields/badges are used for this feature image.

## Example when a real image is available

Put the approved asset into the existing site asset tree, e.g. `public/assets/entity-photos/powerline.webp`, then in the same photo index add:

```json
{
  "entities": {
    "horse:Powerline": "/assets/entity-photos/powerline.webp"
  }
}
```

This is a media **pointer**, not an alternative horse record. Do not add a path until the image file exists, is verified and has permission for display.

The current fixed prototype case associations are:
- `powerline`, `entries` → horse Powerline
- `lastmatch` → horse The Last Match
- `pieta` → horse Pieta
- `newsbuzz` → horse Argosy colt (current prototype designation)
- `cedar` → farm Cedar Spoke
- `saratoga` → bloodstock contact Alistair Dunleavy (or a case-specific Saratoga sales photo)
- `cash` → generic finance/stable operations

For an auction case, for example, set `cases.saratoga` to an actual sales-ring image to take priority over the contact portrait. Set `categories.sales` for a generic sales-ring photograph when no more specific media exists.

## When the authoritative entity media fields arrive

Move the lookup to the canonical horse/person/track/farm IDs and their approved image references. Names are a temporary UI-only bridge in this prototype, **not** stable historical keys. The immutable entity ID and media ownership/rights fields in the authoritative database must determine which photo belongs to which entity.

Horse, jockey/trainer, track, sales firm, farm and historical photo galleries can all feed this same full-width feature slot. Profile portraits and badges remain separate visual treatments.

**Guardrail:** Never identify a generic or unrelated horse photograph as the actual subject of a decision. Image captions correctly distinguish the real entity photo from an editorial reference.
