# Verify Cockpit picked up the plugin (and force a reload)

## Steps
1. Confirm the files are where Cockpit expects them, flat (no nested `dist/`):
   ```bash
   ls ~/.local/share/cockpit/virtualbox/manifest.json ~/.local/share/cockpit/virtualbox/index.html
   ```
2. Log into Cockpit in the browser as the OS user that owns that directory — per-user packages under `~/.local/share/cockpit` are visible only to that user's Cockpit session, not to other users on the same host.
3. Look for the sidebar entry labeled per `manifest.json`'s `tools.index.label` (currently `"VirtualBox (dev)"`).
4. If the plugin was already open in a browser tab before the deploy/update, hard-reload it (`Ctrl+Shift+R`) — Cockpit does not watch the filesystem for changes.
5. If it is still missing after that, force Cockpit to re-scan packages for that user: log out and back into Cockpit, or restart the user's bridge session (`systemctl --user restart cockpit-bridge` if it runs as a systemd user unit on the target distro).

## Errors
- Entry never appears, files confirmed present at the right flat path → check `manifest.json`'s `requires.cockpit` (currently `"150"`) against the host's installed Cockpit version (e.g. `cockpit-bridge --version`, or the distro package version); Cockpit silently skips a package whose `requires` it doesn't meet — no error is logged anywhere visible.
- Entry appears in the sidebar but the page is blank, with a console error mentioning `cockpit` being undefined → `../base1/cockpit.js` did not load; this only happens when the page isn't actually being served through a Cockpit session (see the guard in `src/client/integration/vbox.ts`).
