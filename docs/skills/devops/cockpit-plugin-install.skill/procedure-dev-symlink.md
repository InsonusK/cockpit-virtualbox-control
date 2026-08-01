# Install for local development (symlink)

Use when iterating on the plugin locally and every rebuild should show up without re-copying files.

## Steps
```bash
mkdir -p ~/.local/share/cockpit
npm run build                                   # one-time initial build, see installation.md
ln -s "$(pwd)/dist" ~/.local/share/cockpit/virtualbox
npx tsc --watch                                 # keep rebuilding dist/ on every save
```

## Result
- Log into Cockpit in the browser as the same OS user that owns `~/.local/share/cockpit/virtualbox`.
- "VirtualBox (dev)" appears in the sidebar (label taken from `src/manifest.json`'s `tools.index.label`).
- After each save, `tsc --watch` rebuilds `dist/`, but Cockpit still needs a manual reload — hard-reload the browser tab (`Ctrl+Shift+R`) to see the change.

## Errors
- Sidebar entry missing, files confirmed on disk → see [procedure-verify.md](./procedure-verify.md).
- Page loads blank, browser console shows `cockpit is not available: ensure the plugin is opened from Cockpit` → `dist/index.html` was opened directly (e.g. `file://`) instead of through a running Cockpit session; `../base1/cockpit.js` only resolves inside Cockpit (guard is in `src/client/integration/vbox.ts`).
