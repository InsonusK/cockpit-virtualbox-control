const UUID_RE = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

/**
 * Validates that a string is a UUID.
 *
 * @param {string} uuid — UUID to validate.
 * @throws {Error} if the UUID format is invalid.
 */
function assertUuid(uuid) {
    if (!UUID_RE.test(uuid)) {
        throw new Error("Invalid VM UUID: " + uuid);
    }
}

/**
 * Runs `VBoxManage` through `cockpit.spawn` with a fixed environment.
 *
 * All public functions must pass arguments as an array to avoid shell injection.
 *
 * @param {string[]} args — arguments for `VBoxManage`.
 * @returns {Promise<string>} promise resolving with command output.
 * @throws {Error} if `cockpit` global is missing.
 */
function vbox(args) {
    if (typeof cockpit === "undefined") {
        throw new Error("cockpit is not available: ensure the plugin is opened from Cockpit and ../base1/cockpit.js is loaded");
    }
    return cockpit.spawn(["VBoxManage", ...args], {
        err: "message",
        environ: ["LC_ALL=C"],
    });
}

/** @returns {Promise<string>} list of VMs in `"Name" {uuid}` format. */
export function listVms() {
    return vbox(["list", "vms"]);
}

/** @returns {Promise<string>} list of registered hard disk images. */
export function listHdds() {
    return vbox(["list", "hdds"]);
}

/** @returns {Promise<string>} list of registered DVD images. */
export function listDvds() {
    return vbox(["list", "dvds"]);
}

/**
 * Returns machinereadable info for a VM.
 *
 * @param {string} uuid — VM UUID.
 * @returns {Promise<string>} machinereadable `showvminfo` output.
 */
export function vmInfo(uuid) {
    assertUuid(uuid);
    return vbox(["showvminfo", uuid, "--machinereadable"]);
}

/**
 * Returns human-readable info for a VM.
 *
 * @param {string} uuid — VM UUID.
 * @returns {Promise<string>} human-readable `showvminfo` output.
 */
export function vmInfoHuman(uuid) {
    assertUuid(uuid);
    return vbox(["showvminfo", uuid]);
}

const VALID_CONTROL_COMMANDS = new Set(["pause", "resume", "acpipowerbutton", "poweroff", "savestate"]);

/**
 * Sends a control command to a running VM.
 *
 * @param {string} uuid — VM UUID.
 * @param {string} command — one of "pause", "resume", "acpipowerbutton", "poweroff", "savestate".
 * @returns {Promise<string>} command output.
 * @throws {Error} if the command is not allowed.
 */
export function controlVm(uuid, command) {
    assertUuid(uuid);
    if (!VALID_CONTROL_COMMANDS.has(command)) {
        throw new Error("Invalid VM control command: " + command);
    }
    return vbox(["controlvm", uuid, command]);
}

const VALID_START_TYPES = new Set(["headless", "gui"]);

/**
 * Starts a VM in the requested mode.
 *
 * @param {string} uuid — VM UUID.
 * @param {string} type — "headless" or "gui".
 * @returns {Promise<string>} command output.
 * @throws {Error} if the start type is invalid.
 */
export function startVm(uuid, type) {
    assertUuid(uuid);
    if (!VALID_START_TYPES.has(type)) {
        throw new Error("Invalid VM start type: " + type);
    }
    return vbox(["startvm", uuid, "--type", type]);
}

/**
 * Lists snapshots of a VM in machinereadable format.
 *
 * @param {string} uuid — VM UUID.
 * @returns {Promise<string>} snapshot list output.
 */
export function listSnapshots(uuid) {
    assertUuid(uuid);
    return vbox(["snapshot", uuid, "list", "--machinereadable"]);
}

/**
 * Creates a new snapshot for a VM.
 *
 * @param {string} uuid — VM UUID.
 * @param {string} name — snapshot name.
 * @returns {Promise<string>} command output.
 * @throws {Error} if the snapshot name is empty.
 */
export function takeSnapshot(uuid, name) {
    assertUuid(uuid);
    if (!name || !name.trim()) {
        throw new Error("Snapshot name is empty");
    }
    return vbox(["snapshot", uuid, "take", name.trim()]);
}

/**
 * Restores a VM to the specified snapshot.
 *
 * @param {string} uuid — VM UUID.
 * @param {string} name — snapshot name.
 * @returns {Promise<string>} command output.
 * @throws {Error} if the snapshot name is empty.
 */
export function restoreSnapshot(uuid, name) {
    assertUuid(uuid);
    if (!name || !name.trim()) {
        throw new Error("Snapshot name is empty");
    }
    return vbox(["snapshot", uuid, "restore", name.trim()]);
}
