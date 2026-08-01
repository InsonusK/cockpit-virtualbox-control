# Remove the plugin from a host

## Steps
```bash
rm -rf ~/.local/share/cockpit/virtualbox
```

If it was installed via [procedure-dev-symlink.md](./procedure-dev-symlink.md), this only removes the symlink — the repo's own `dist/` directory is untouched and can be re-linked later.

## Result
The sidebar entry disappears after the next Cockpit session reload — see [procedure-verify.md](./procedure-verify.md) steps 4–5 to force it immediately instead of waiting for the user's next login.
