# Installation and access

Obtain a `dist/` build before deploying it anywhere — pick one of the two ways below.

## MUST
- **From source** (requires Node.js 24 and this repo checked out):
  ```bash
  npm ci
  npm run build   # runs tsc + scripts/copy-static.js -> dist/
  ```
- **From a GitHub Release** (no Node required on the machine doing the fetch; this is what production deploys use — see the repo's `README.md`, "Релиз" section, and `.github/workflows/release-master.yml`):
  ```bash
  gh release list --repo InsonusK/cockpit-virtualbox-control
  gh release download <tag> --repo InsonusK/cockpit-virtualbox-control --pattern 'dist.tar.gz'
  ```
  Every merged release PR into `master` publishes a `dist.tar.gz` asset automatically, tagged `v<version>` (the version from `src/manifest.json` at merge time).

## SHOULD
- Verify the build before deploying it — `index.html` and `manifest.json` must be present, and no `.ts` file must be present:
  ```bash
  test -f dist/index.html && test -f dist/manifest.json && ! find dist -name '*.ts' | grep -q .
  ```
