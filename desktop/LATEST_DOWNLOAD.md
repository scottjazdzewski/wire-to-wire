# One-click newest Wire to Wire desktop TEST EXE

These links are designed to stay the same as newer **tested** Windows builds are published:

- **Portable no-install EXE:** https://github.com/scottjazdzewski/wire-to-wire/releases/latest/download/WireToWire-Portable-Latest.exe
- **Faster no-install folder ZIP:** https://github.com/scottjazdzewski/wire-to-wire/releases/latest/download/WireToWire-NoInstall-Latest.zip
- **Regular Windows setup EXE:** https://github.com/scottjazdzewski/wire-to-wire/releases/latest/download/WireToWire-Setup-Latest.exe
- **Which build is newest?** https://github.com/scottjazdzewski/wire-to-wire/releases/latest
- **Exact source version and SHA-256 hashes:** https://github.com/scottjazdzewski/wire-to-wire/releases/latest/download/WTW-Latest-Build-Info.json
- **Editable game source:** https://github.com/scottjazdzewski/wire-to-wire
- **Source ZIP for the exact tested build:** Open the Build Info JSON above and use its `sourceArchiveUrl` link.
- **Download sizes and integrity:** The Build Info JSON lists exact bytes and SHA-256 for each Windows format; choose one standalone download instead of a combined package.

Bookmark the portable EXE link if your machine permits an unsigned portable application; otherwise use the extracted-folder build, if permitted by workplace policies. The setup EXE is for machines where normal installation is authorized.

## How updates arrive

The **Wire to Wire Windows Desktop EXE** workflow in .github/workflows/windows-desktop-exe.yml:

1. Builds all three Windows outputs from one exact approved main commit.
2. Runs packaged-app startup, local process exit/restart and data persistence checks.
3. Validates binary signatures (MZ EXEs and PK ZIP), expected version and sizes, and creates SHA-256 hashes.
4. Uploads every asset to a unique draft GitHub Release; only after the full set exists does it publish the Release as **Latest**.
5. Keeps the existing newest working release untouched if the build fails. Never points the stable link to an untested or incomplete build.

A new workflow runs when relevant desktop/game source changes are merged into main, or can be started manually using GitHub Actions > Wire to Wire Windows Desktop EXE > Run workflow > main. A successful build of an outdated main revision is not published. The latest URL is therefore the **most recently fully verified published build**, not necessarily every latest repository commit. The releases are versioned and can be rolled back to a specific prior version.

There is no need for the user to manage GitHub workflow artifacts or hunt for short-lived Actions ZIPs. A build must first be published successfully for the URLs to work. Published GitHub Release assets do not expire after the workflow artifact's 14-day retention period.

## Save safety and development status

**This is an unsigned, publicly downloadable development test build, NOT a retail game.** Windows SmartScreen may warn and managed machines may block it. Follow workplace IT policies; do not bypass restrictions.

The first verified G1 portable EXE opened and preserved the user's January 1999 career through close/reopen. This does not certify full offline historic D1 coverage, user-defined world creation, all-entity editing, transactional desktop career authority or retail signing. Make .wtwsave backups before trying new builds. Never delete saved career folders, or replace the previous working executable before a new build has been tested.

Do not repurpose these development URLs as commercial download links without retail release gates and licensing/security review.
