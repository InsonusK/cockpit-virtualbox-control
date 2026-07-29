"use strict";

const UUID_RE = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

function assertUuid(uuid) {
    if (!UUID_RE.test(uuid)) {
        throw new Error("Invalid VM UUID: " + uuid);
    }
}

function vbox(args) {
    return cockpit.spawn(["VBoxManage", ...args], {
        err: "message",
        environ: ["LC_ALL=C"],
    });
}

function listVms() {
    return vbox(["list", "vms"]);
}

function listHdds() {
    return vbox(["list", "hdds"]);
}

function listDvds() {
    return vbox(["list", "dvds"]);
}

function vmInfo(uuid) {
    assertUuid(uuid);
    return vbox(["showvminfo", uuid, "--machinereadable"]);
}

function vmInfoHuman(uuid) {
    assertUuid(uuid);
    return vbox(["showvminfo", uuid]);
}

const VALID_CONTROL_COMMANDS = new Set(["pause", "resume", "acpipowerbutton", "poweroff", "savestate"]);

function controlVm(uuid, command) {
    assertUuid(uuid);
    if (!VALID_CONTROL_COMMANDS.has(command)) {
        throw new Error("Invalid VM control command: " + command);
    }
    return vbox(["controlvm", uuid, command]);
}

const VALID_START_TYPES = new Set(["headless", "gui"]);

function startVm(uuid, type) {
    assertUuid(uuid);
    if (!VALID_START_TYPES.has(type)) {
        throw new Error("Invalid VM start type: " + type);
    }
    return vbox(["startvm", uuid, "--type", type]);
}

function listSnapshots(uuid) {
    assertUuid(uuid);
    return vbox(["snapshot", uuid, "list", "--machinereadable"]);
}

function takeSnapshot(uuid, name) {
    assertUuid(uuid);
    if (!name || !name.trim()) {
        throw new Error("Snapshot name is empty");
    }
    return vbox(["snapshot", uuid, "take", name.trim()]);
}

function restoreSnapshot(uuid, name) {
    assertUuid(uuid);
    if (!name || !name.trim()) {
        throw new Error("Snapshot name is empty");
    }
    return vbox(["snapshot", uuid, "restore", name.trim()]);
}
