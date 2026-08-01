# Install/update a release build (production, e.g. from ansible)

Use for any host that is not your local dev machine — the target needs no Node.js/npm, only `tar`/`sha256sum` and network access to GitHub (or copies of `dist.tar.gz` and `dist.tar.gz.sha256` already staged).

Two install targets are supported — pick one per host:
- **Per-user** (default, no root needed): `~/.local/share/cockpit/virtualbox` — visible only to the one OS user whose home it's in.
- **System-wide** (needs root): `/usr/share/cockpit/virtualbox` — visible to every OS user with a Cockpit session on the host. Use only when the plugin genuinely needs to be shared across multiple OS accounts. The directory must stay root-owned and not group/world-writable — that's what makes it safe to share: no unprivileged user on the host can plant code that other users' sessions load.

Either way, `VBoxManage` still runs unelevated as whichever OS user opened the Cockpit session — the install location changes *who can see the plugin entry*, not what privilege it runs with (the plugin never requests Cockpit's superuser bridge).

## Verify the checksum first (MUST)
Every release publishes `dist.tar.gz` alongside a `dist.tar.gz.sha256` asset (added by `.github/workflows/release-master.yml`). This is the only integrity check on the deploy path — the tarball is otherwise fetched over a plain URL with no other pinning — so verify it before extracting, on both install targets. Do not proceed to extraction if the check fails or the checksum asset is missing.

## Steps — per-user
```bash
# 1. Fetch the release asset and its checksum (pick a tag — see installation.md)
tag="<tag>"
base="https://github.com/InsonusK/cockpit-virtualbox-control/releases/download/${tag}"
curl -fsSL -o dist.tar.gz "${base}/dist.tar.gz"
curl -fsSL -o dist.tar.gz.sha256 "${base}/dist.tar.gz.sha256"

# 2. Verify before touching anything on disk
sha256sum -c dist.tar.gz.sha256

# 3. Replace the plugin directory atomically
target="$HOME/.local/share/cockpit/virtualbox"
tmp="$(mktemp -d)"
tar xzf dist.tar.gz -C "$tmp"
rm -rf "$target"
mkdir -p "$(dirname "$target")"
mv "$tmp" "$target"
```

Ansible equivalent (same target path, same "replace, don't merge" semantics; `get_url`'s `checksum` parameter accepts a URL to a checksum file and verifies the download against it before anything is extracted):
```yaml
- name: Download and verify release tarball
  ansible.builtin.get_url:
    url: "https://github.com/InsonusK/cockpit-virtualbox-control/releases/download/{{ vbox_plugin_tag }}/dist.tar.gz"
    dest: "/tmp/vbox-plugin-{{ vbox_plugin_tag }}.tar.gz"
    checksum: "sha256:https://github.com/InsonusK/cockpit-virtualbox-control/releases/download/{{ vbox_plugin_tag }}/dist.tar.gz.sha256"

- name: Deploy VirtualBox Cockpit plugin (per-user)
  ansible.builtin.unarchive:
    src: "/tmp/vbox-plugin-{{ vbox_plugin_tag }}.tar.gz"
    dest: "{{ ansible_env.HOME }}/.local/share/cockpit/virtualbox"
    remote_src: true
  # dest must exist and be emptied first (or use a temp-dir-then-move pattern like the
  # shell steps above) — unarchive merges into an existing directory, it does not replace it.
```

## Steps — system-wide (all users)
Same download-and-verify steps as above, then extract as root and lock ownership down:
```bash
target="/usr/share/cockpit/virtualbox"
tmp="$(mktemp -d)"
tar xzf dist.tar.gz -C "$tmp"
sudo rm -rf "$target"
sudo mkdir -p "$(dirname "$target")"
sudo mv "$tmp" "$target"
sudo chown -R root:root "$target"
sudo chmod -R go-w "$target"
```

Ansible equivalent (`become: true` for root; `unarchive`'s `owner`/`group`/`mode` pin ownership on extraction):
```yaml
- name: Download and verify release tarball
  ansible.builtin.get_url:
    url: "https://github.com/InsonusK/cockpit-virtualbox-control/releases/download/{{ vbox_plugin_tag }}/dist.tar.gz"
    dest: "/tmp/vbox-plugin-{{ vbox_plugin_tag }}.tar.gz"
    checksum: "sha256:https://github.com/InsonusK/cockpit-virtualbox-control/releases/download/{{ vbox_plugin_tag }}/dist.tar.gz.sha256"

- name: Deploy VirtualBox Cockpit plugin (system-wide, all users)
  become: true
  ansible.builtin.unarchive:
    src: "/tmp/vbox-plugin-{{ vbox_plugin_tag }}.tar.gz"
    dest: "/usr/share/cockpit/virtualbox"
    remote_src: true
    owner: root
    group: root
    mode: "0755"
```

## Result
- The plugin directory now contains exactly the release's flat file set (`index.html`, `manifest.json`, `app.js`, ...), for the target scope (one user, or all users).
- No build step runs on this host — the tarball is already compiled.

## Errors
- `sha256sum: WARNING: 1 computed checksum did NOT match` (or ansible's `get_url` failing with a checksum mismatch) → do not proceed; the download may be corrupted or tampered with — re-fetch over a trusted network path and re-verify before extracting.
- `tar: Unexpected EOF` / zero-byte file → the release tag or asset name is wrong; re-check with `gh release list --repo InsonusK/cockpit-virtualbox-control`.
- Plugin missing from the sidebar after deploy → see [procedure-verify.md](./procedure-verify.md); the most common cause is extracting one directory too deep (`virtualbox/dist/index.html` instead of `virtualbox/index.html`) — double-check the `tar xzf ... -C` target, or that `unarchive`'s `dest` was emptied first.
- System-wide install not visible to a user → confirm that user actually opened a fresh Cockpit session after the deploy (see [procedure-verify.md](./procedure-verify.md)), and that `/usr/share/cockpit/virtualbox` is readable by others (`chmod go-w`, not `go-rx`, when locking down ownership).
