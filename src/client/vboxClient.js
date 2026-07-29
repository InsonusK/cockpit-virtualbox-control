const UUID_RE = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

function assertUuid(uuid) {
    if (!UUID_RE.test(uuid)) {
        throw new Error("Invalid VM UUID: " + uuid);
    }
}

function vbox(args) {
    if (typeof cockpit === "undefined") {
        throw new Error("cockpit is not available: ensure the plugin is opened from Cockpit and ../base1/cockpit.js is loaded");
    }
    return cockpit.spawn(["VBoxManage", ...args], {
        err: "message",
        environ: ["LC_ALL=C"],
    });
}

export function listVms() {
    return vbox(["list", "vms"]);
}

export function listHdds() {
    return vbox(["list", "hdds"]);
}

export function listDvds() {
    return vbox(["list", "dvds"]);
}

export function vmInfo(uuid) {
    assertUuid(uuid);
    return vbox(["showvminfo", uuid, "--machinereadable"]);
}

export function vmInfoHuman(uuid) {
    assertUuid(uuid);
    return vbox(["showvminfo", uuid]);
}

const VALID_CONTROL_COMMANDS = new Set(["pause", "resume", "acpipowerbutton", "poweroff", "savestate"]);

export function controlVm(uuid, command) {
    assertUuid(uuid);
    if (!VALID_CONTROL_COMMANDS.has(command)) {
        throw new Error("Invalid VM control command: " + command);
    }
    return vbox(["controlvm", uuid, command]);
}

const VALID_START_TYPES = new Set(["headless", "gui"]);

export function startVm(uuid, type) {
    assertUuid(uuid);
    if (!VALID_START_TYPES.has(type)) {
        throw new Error("Invalid VM start type: " + type);
    }
    return vbox(["startvm", uuid, "--type", type]);
}

export function listSnapshots(uuid) {
    assertUuid(uuid);
    return vbox(["snapshot", uuid, "list", "--machinereadable"]);
}

export function takeSnapshot(uuid, name) {
    assertUuid(uuid);
    if (!name || !name.trim()) {
        throw new Error("Snapshot name is empty");
    }
    return vbox(["snapshot", uuid, "take", name.trim()]);
}

export function restoreSnapshot(uuid, name) {
    assertUuid(uuid);
    if (!name || !name.trim()) {
        throw new Error("Snapshot name is empty");
    }
    return vbox(["snapshot", uuid, "restore", name.trim()]);
}
