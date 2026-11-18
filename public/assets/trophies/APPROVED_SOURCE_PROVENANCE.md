# Wire to Wire — approved graded-stakes trophies

These three compact images are **resized from the exact user-approved Rail & Rye G1/G2/G3 trophy PNGs**, without changing the artwork. The authoritative original 591–659 px PNGs remain in the user's sealed `TBS_RACE_DASHBOARD_PRODUCTION_ROOT_CURRENT.zip` package (Drive ID `1aFhp5PdAS23NyKOFPnkpk4M5KKySl9hb`).

| Grade | Original file in ZIP | Verified original SHA-256 | Website file | Website SHA-256 |
| --- | --- | --- | --- | --- |
| G1, gold | `assets/graded_trophy_G1.png` | `182b6a71ad86928037625550b8ac2542f85fac4f0d6f753e06696f4410f0e6ec` | `approved-grade-1-64.png` | `6a2d3ff6ae7c189f797d6fa40ab980c4e8361ee8741029c3439aa91880b2f81b` |
| G2, silver | `assets/graded_trophy_G2.png` | `d0b11aac0f0d75169f19c7aceeeb3e30f73e3c78d932c0ad236e1790481f5a52` | `approved-grade-2-64.png` | `f52f728d52903b97e5e5aa48d5fe70dd5e099b1abbf6a919feb2ffff99387c94` |
| G3, bronze | `assets/graded_trophy_G3.png` | `b6dbeed7675f8c866b5d3feddc68f3ef521c758fa814807d39da60e7fb86c2d8` | `approved-grade-3-64.png` | `94c50c313bcf4824953241ff2e7d8d243391ac8a1eb34372e2563ded077c8822` |

Each on-site file is a 64×64 RGBA transparent PNG: source artwork resized by Lanczos with alpha, centered on a transparent square, no new illustration. Render with CSS at 16×16 px desktop / 15×15 px narrow. Grade identity is always derived from the actual G1/G2/G3 race record.

Do **not** use the damaged historical sprite `g123-sprite.png` or the unrelated placeholder vectors `grade-1.svg`, `grade-2.svg`, `grade-3.svg` for the track-stakes table. They remain in the repository only for compatibility with other references; the track table must use `approved-grade-{1,2,3}-64.png`.
