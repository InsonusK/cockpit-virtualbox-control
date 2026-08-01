---
name: virtualbox-cockpit-plugin-install
description: How to build, install, verify, update, and remove this repo's VirtualBox Cockpit plugin on a host running Cockpit
whenToUse: when an agent needs to add this plugin to a Cockpit instance for local development, deploy a release build to a server (e.g. from an ansible playbook or another CI/CD step), verify Cockpit picked it up after a change, or remove it
tags:
  - skill/documentation/for-ai
  - skill/devops/cockpit
---

# Goal
Give an agent everything needed to get this repo's Cockpit plugin visible and working inside Cockpit — for local dev iteration and for production deployment — without guessing paths or reload steps.

# Core Principle
- Cockpit auto-discovers packages by directory name under a fixed filesystem location; there is no registration command or config file to edit — copying/symlinking the right files to the right path *is* the entire "install".
- This repo's package name is `virtualbox`, so the deploy target directory must be literally named `virtualbox`.
- Cockpit needs `dist/`'s **contents** directly inside that directory (flat), not the `dist/` folder itself nested one level down — i.e. `.../cockpit/virtualbox/index.html`, `.../cockpit/virtualbox/manifest.json`, not `.../cockpit/virtualbox/dist/index.html`.
- Only compiled output belongs there. `dist/` is produced by `npm run build` (`tsc` + `scripts/copy-static.js`) and is git-ignored — TypeScript sources are never deployed, and `.ts` files must never end up at the deploy target.
- `VBoxManage` must be on `PATH` for the OS user Cockpit runs the plugin as (the logged-in user), because the plugin calls it via `cockpit.spawn()` (`src/client/integration/vbox.ts`) with no elevation.
- `manifest.json` currently declares `"requires": {"cockpit": "150"}` — Cockpit silently refuses to load the package on an older Cockpit (no error, the sidebar entry just never appears).
- After files change on disk, Cockpit does not hot-reload — see [procedure-verify.md](./procedure-verify.md).
- Every release publishes `dist.tar.gz` alongside a `dist.tar.gz.sha256` checksum (see `.github/workflows/release-master.yml`) — this is the only integrity check on the deploy path (the tarball is fetched over a plain URL with no other pinning), so a prod deploy must verify it before extracting; see [procedure-prod-deploy.md](./procedure-prod-deploy.md).
- Cockpit supports two package locations with different visibility: per-user (`~/.local/share/cockpit/virtualbox`, visible only to that one OS user's session) and system-wide (`/usr/share/cockpit/virtualbox`, visible to every OS user with a Cockpit session on the host). Neither changes what privilege `VBoxManage` runs with — the plugin never requests Cockpit's superuser bridge (`src/client/integration/vbox.ts` calls `cockpit.spawn()` with no `superuser` option), so it always runs as whichever OS user opened the session, in both locations.

# Installation and access
See [installation.md](./installation.md) for how to obtain a `dist/` build in the first place (from source, or from a GitHub Release asset) — do this before any procedure below.

# Procedures
- [procedure-dev-symlink.md](./procedure-dev-symlink.md) — install for local development with live rebuild (symlink `dist/`).
- [procedure-prod-deploy.md](./procedure-prod-deploy.md) — install/update a release build on a server (e.g. from ansible); target host needs no Node.
- [procedure-verify.md](./procedure-verify.md) — confirm Cockpit picked up the plugin, and how to make it reload after an update.
- [procedure-remove.md](./procedure-remove.md) — remove the plugin from a host.

# Rule

## MUST
- Deploy to `~/.local/share/cockpit/virtualbox` for the OS user that will view the plugin in Cockpit, unless the plugin must be visible to *every* OS user on the host — this repo's dev workflow, release workflow, and `README.md` default to exactly this path; do not invent a different package directory name. For the multi-user case, use the system-wide path instead (see SHOULD below) — do not deploy the same plugin to both locations on one host.
- Copy/link the *contents* of `dist/`, not the `dist/` directory itself, into the target `virtualbox/` directory.
- Reload the browser tab (or the user's Cockpit session, see [procedure-verify.md](./procedure-verify.md)) after any file change — Cockpit does not watch the filesystem.
- Verify `dist.tar.gz` against its published `dist.tar.gz.sha256` before extracting it in any prod deploy — see [procedure-prod-deploy.md](./procedure-prod-deploy.md). Do not extract a tarball that fails or is missing this check.

## SHOULD
- Prefer [procedure-prod-deploy.md](./procedure-prod-deploy.md) (release asset `dist.tar.gz`) for anything other than active local development, so the target host never needs Node/npm.
- Check `manifest.json`'s `requires.cockpit` against the target's installed Cockpit version before deploying to a new host.
- Use the system-wide path `/usr/share/cockpit/virtualbox` only when the plugin genuinely needs to be visible to more than one OS user on the host (e.g. a shared admin box) — see [procedure-prod-deploy.md](./procedure-prod-deploy.md)'s "system-wide" steps. It requires root and the directory must stay root-owned, not group/world-writable — that ownership is what makes sharing it across users safe (no unprivileged user on the host can tamper with what other users' sessions load). It does not change what privilege the plugin runs with; see the Core Principle above.

## MUST NOT
- Symlink or copy the whole repo (or `src/`) into the Cockpit packages directory — only `dist/`'s contents belong there.
- Leave a system-wide install (`/usr/share/cockpit/virtualbox`) writable by non-root users — that would defeat the reason for using it over the per-user path.

# Anti-patterns
- **Deploying `dist/` one level too deep** — copying the whole `dist` folder into `virtualbox/` gives `.../virtualbox/dist/index.html` instead of `.../virtualbox/index.html`; Cockpit can't find `manifest.json` at the expected location and silently omits the plugin from the sidebar.
- **Deploying the repo instead of the build** — copying `src/` or the repo root means Cockpit tries to load `.ts` files it cannot execute; the page loads blank with a browser console error about unresolved modules (see `README.md`'s "Про `cockpit.js`" section for why `.ts` never works here).

# Check list
- [ ] A `dist/` build exists (via `npm run build`, or a downloaded `dist.tar.gz` release asset — see [installation.md](./installation.md)).
- [ ] For a prod deploy, `dist.tar.gz` was verified against `dist.tar.gz.sha256` before extraction — see [procedure-prod-deploy.md](./procedure-prod-deploy.md).
- [ ] Its contents (not the folder) are at `~/.local/share/cockpit/virtualbox/` for the target user, or at `/usr/share/cockpit/virtualbox/` (root-owned) if the plugin must be visible to every OS user on the host.
- [ ] `VBoxManage` is on `PATH` for the user(s) who will use the plugin.
- [ ] The target's Cockpit version satisfies `manifest.json`'s `requires.cockpit`.
- [ ] The browser tab (or Cockpit session) was reloaded after the update — see [procedure-verify.md](./procedure-verify.md).
