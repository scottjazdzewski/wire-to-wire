# Wire to Wire — initial desktop executable (G1)

This folder adds **one Windows Electron shell** for the existing `public/next/` management game. No duplicate UI, simulation engine, web hosting, authentication, or HTTP server.

The app's only gameplay origin is `wtw://game`; all `/next/`, `/1999/`, `/assets/` and other static sources resolve from bundled `public/` files. External HTTP/WebSocket requests are cancelled. CSP restricts the content. The existing career browser origin is preserved across program restarts.

## Run locally as a developer

```bash
python -m pip install Pillow
python scripts/build-wtw-desktop-icon.py
cd desktop
npm install
npm start
```

For an installable Windows binary, run `npm run build:windows` from `desktop/`, or use the GitHub Actions workflow **Wire to Wire Windows Installer**. The Windows CI uploads a downloadable `WireToWire-Setup-*.exe` as an artifact. Debug builds are unsigned; Windows may warn on launch.

## G1 acceptance limits (must not misrepresent this prototype)

- The management UI launches from **bundled files**, without a remote website, local HTTP server or Python on the customer's PC.
- The browser-origin IndexedDB and localStorage transition state persists between app launches under Electron's per-user application directory. **This is not yet desktop-authoritative transactional career storage (G3).**
- The private D1 historical archive `/api/` routes are **not** shipped as a complete offline history database. API requests return 404 (G2) rather than silently fetching source data from the internet.
- There is no retail code-signing identity, update channel, or Windows installation on a separate clean consumer machine yet (G5).
- The bundled static runtime currently contains only public game resources. The older bridge code remains non-visual but active for game commands until source-parity migration G4.
- A successful startup/restart smoke test does **not** mean all race progression, historical data, screenshots and long-lived careers are retail-certified.

## One approved application icon

The Windows ICO is generated at build time from `public/assets/wtw-office-approved-logo.png`; the original brand asset remains untouched.

## Windows CI proof

`scripts/windows-desktop-smoke.ps1` launches the **unpacked packaged application** in two separate Windows processes using the same per-user test profile. It validates local content origin, approved management UI, January 1999 state and a persisted marker, without requiring a browser or hosted server. It also builds and uploads the NSIS installer.

Next: migrate historical records into a bundled indexed pack, then move full career authority into per-user desktop-owned storage.

## Windows no-window startup troubleshooting (G1.1)

On a managed/work computer, seeing the Windows SmartScreen **Run anyway** prompt means only the first unsigned-file reputation check was passed. It does **not** prove endpoint security permits the extracted portable Electron child or its DLLs. Never bypass IT-managed app restrictions; ask IT if corporate policy blocks the program.

Three development downloads are built from exactly the same app:

1. `WireToWire-Portable-0.1.1-x64.exe`: single file; extracts its runtime to Windows' temp location before launch. Some endpoint policies disallow execution from temp.
2. `WireToWire-NoInstall-Folder-0.1.1-x64.zip`: extract the `win-unpacked` directory to an approved local location and run `Wire to Wire.exe` **inside** it. **No installer or admin privileges needed**, but the corporate allowlist may still block unsigned EXEs. Keep every DLL/resource alongside the executable. Do not run directly inside ZIP preview.
3. `WireToWire-Setup-0.1.1-x64.exe`: standard per-user development installer. Do not install this on a locked-down workplace computer without approval.

If the app launches and fails after Electron startup, it now writes `wtw-startup-diagnostics.log` in Electron's per-user `app.getPath('userData')` folder and displays an explicit error dialog with the file path. On many Windows installations this is within `%APPDATA%\Wire to Wire`. A failure before Electron's main process starts may produce **no** log: the Windows security/event logs and IT help desk are the appropriate route in that case.

The Windows CI must verify both local origin/storage reopen and **an actually visible game window** with a screenshot. Headless/hidden-window tests alone are no longer accepted as proof the game opens to a human user. The folder archive is an alternate diagnostic format, not a means to circumvent endpoint policy.

**This is still G1 development software, unsigned and NOT YET DESKTOP CERTIFIED for retail.**
