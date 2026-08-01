# Install/update a release build (production, e.g. from ansible)

Use for any host that is not your local dev machine — the target needs no Node.js/npm, only `tar` and network access to GitHub (or a copy of `dist.tar.gz` already staged).

## Steps
```bash
# 1. Fetch the release asset (pick a tag — see installation.md)
curl -fsSL -o dist.tar.gz \
  "https://github.com/InsonusK/cockpit-virtualbox-control/releases/download/<tag>/dist.tar.gz"

# 2. Replace the plugin directory atomically
target="$HOME/.local/share/cockpit/virtualbox"
tmp="$(mktemp -d)"
tar xzf dist.tar.gz -C "$tmp"
rm -rf "$target"
mkdir -p "$(dirname "$target")"
mv "$tmp" "$target"
```

Ansible equivalent (same target path, same "replace, don't merge" semantics):
```yaml
- name: Deploy VirtualBox Cockpit plugin
  ansible.builtin.unarchive:
    src: "https://github.com/InsonusK/cockpit-virtualbox-control/releases/download/{{ vbox_plugin_tag }}/dist.tar.gz"
    dest: "{{ ansible_env.HOME }}/.local/share/cockpit/virtualbox"
    remote_src: true
  # dest must exist and be emptied first (or use a temp-dir-then-move pattern like the
  # shell steps above) — unarchive merges into an existing directory, it does not replace it.
```

## Result
- `~/.local/share/cockpit/virtualbox/` now contains exactly the release's flat file set (`index.html`, `manifest.json`, `app.js`, ...) for the target user.
- No build step runs on this host — the tarball is already compiled.

## Errors
- `tar: Unexpected EOF` / zero-byte file → the release tag or asset name is wrong; re-check with `gh release list --repo InsonusK/cockpit-virtualbox-control`.
- Plugin missing from the sidebar after deploy → see [procedure-verify.md](./procedure-verify.md); the most common cause is extracting one directory too deep (`virtualbox/dist/index.html` instead of `virtualbox/index.html`) — double-check the `tar xzf ... -C` target, or that `unarchive`'s `dest` was emptied first.
