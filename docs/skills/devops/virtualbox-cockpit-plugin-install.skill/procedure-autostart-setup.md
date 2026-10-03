# Enable VirtualBox host autostart (so the plugin's "autostart" toggle works)

The plugin's "Параметры VM" modal can set a per-VM autostart flag (`src/client/integration/modifyVm.ts` calls `VBoxManage modifyvm <uuid> --autostart-enabled on|off`), but that command only succeeds once the **host's** VirtualBox autostart database is configured. This is independent of installing/deploying the plugin itself (see [installation.md](./installation.md) and the other `procedure-*.md` files) — it is a one-time VirtualBox host configuration step, needed once per host per OS user who will own autostarting VMs.

## Core facts
- Without host configuration, `--autostart-enabled on` always fails with:
  ```
  VBoxManage: error: The path to the autostart database is not set
  ```
  regardless of whether the plugin issued the command or a human ran `VBoxManage` directly.
- `VBoxManage setproperty autostartdbpath <path>` writes to the **per-OS-user** VirtualBox config (`~/.config/VirtualBox/VirtualBox.xml`), not a host-wide file. It must be run as the exact OS user that owns the VM and under whose session Cockpit executes `VBoxManage` for that VM — `src/client/integration/vbox.ts` calls `cockpit.spawn()` with no `superuser` option, so every `VBoxManage` call the plugin makes already runs as that same logged-in OS user. Setting the property as `root` or a different user does not make the plugin's calls succeed.
- A separate, unrelated failure mode is `VBoxManage: error: The machine is not mutable (state is Saved)`. That's not an autostart/host-config problem — `--memory`/`--cpus` changes require the VM to be fully powered off (not merely in Saved state); it can surface in the same modal submission as the autostart toggle, but needs a different fix (power off the VM, not touch autostart config).

## Steps
Run as the OS user who owns the VM(s) (the one who logs into Cockpit and sees them in the plugin), with `sudo` only for the two explicitly root-marked commands:

```bash
# 1. Shared autostart database directory (root, one-time per host)
sudo groupadd -f vboxusers                       # skip if the group already exists / already has the right users
sudo mkdir -p /etc/vbox/autostart.d
sudo chgrp vboxusers /etc/vbox/autostart.d
sudo chmod 1770 /etc/vbox/autostart.d             # rwxrwx--T: group-writable, sticky bit so users can't delete each other's config
sudo usermod -aG vboxusers "$USER"                # add the Cockpit-session OS user to the group; re-login (or new Cockpit session) required to take effect

# 2. Enable the autostart service in the package's default config (path/package name vary by distro — see Errors)
sudo sed -i \
  -e 's/^#\?VBOXAUTOSTART_DB=.*/VBOXAUTOSTART_DB=\/etc\/vbox\/autostart.d/' \
  -e 's/^#\?VBOXAUTOSTART_START=.*/VBOXAUTOSTART_START=1/' \
  /etc/default/virtualbox

# 3. Point THIS user's VirtualBox config at the shared database (run unprivileged, as this exact user)
VBoxManage setproperty autostartdbpath /etc/vbox/autostart.d

# 4. Enable and start the host-wide autostart service (root)
sudo systemctl enable --now vboxautostart-service
```

Then (re-)run the plugin's autostart toggle, or directly:
```bash
VBoxManage modifyvm <uuid> --autostart-enabled on
```

## Result
- `VBoxManage modifyvm <uuid> --autostart-enabled on` succeeds for the user who ran step 3, and that user's toggle in the plugin's edit-VM modal (see [docs/usage.md](../../../usage.md)) stops failing.
- The VM configured with `--autostart-enabled on` starts automatically at host boot, before any user logs into Cockpit — verify with `systemctl status vboxautostart-service` and `journalctl -u vboxautostart-service` after a reboot.

## Errors
- `VBoxManage: error: The path to the autostart database is not set` after completing all 4 steps → step 3 was run as a different OS user than the one Cockpit uses for this VM (check which user by running `whoami` from a Cockpit terminal session, not your SSH session); re-run step 3 as that exact user.
- `/etc/default/virtualbox` does not exist → the host's VirtualBox install isn't the Debian/Ubuntu `.deb` package layout this step assumes. Check `systemctl list-unit-files | grep -i autostart` for the actual service name on this host; if no autostart service unit exists at all, this VirtualBox build doesn't ship one — autostart must be implemented with a custom systemd unit that runs `VBoxManage startvm <uuid> --type headless` at boot instead of relying on `vboxautostart-service`.
- `vboxautostart-service` systemd unit not found → confirm the installed package name (`dpkg -l | grep -i virtualbox` / `rpm -qa | grep -i VirtualBox`); some third-party or manually-compiled VirtualBox builds omit the autostart service entirely (see previous bullet).
- `VBoxManage: error: The machine is not mutable (state is Saved)` → unrelated to this procedure; see "Core facts" above — power the VM fully off (not Saved) before changing `--memory`/`--cpus`. The autostart flag itself does not require the VM to be off.
- Toggle still fails after a fresh `sudo usermod -aG vboxusers` → group membership only takes effect for new login sessions; the Cockpit session (and its `cockpit-bridge` process) must be restarted — log out and back into Cockpit, not just re-run the command in an existing shell.
