const UUID_RE = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

/** Validates that a string is a UUID. */
function assertUuid(uuid: string): void {
    if (!UUID_RE.test(uuid)) {
        throw new Error("Invalid VM UUID: " + uuid);
    }
}

/**
 * Runs `VBoxManage` through `cockpit.spawn` with a fixed environment.
 *
 * All public functions must pass arguments as an array to avoid shell injection.
 */
function vbox(args: string[]): Promise<string> {
    if (typeof cockpit === "undefined") {
        throw new Error("cockpit is not available: ensure the plugin is opened from Cockpit and ../base1/cockpit.js is loaded");
    }
    return cockpit.spawn(["VBoxManage", ...args], {
        err: "message",
        environ: ["LC_ALL=C"],
    });
}

/** Lists VMs in `"Name" {uuid}` format. */
export function listVms(): Promise<string> {
    return vbox(["list", "vms"]);
}

/** Lists registered hard disk images. */
export function listHdds(): Promise<string> {
    return vbox(["list", "hdds"]);
}

/** Lists registered DVD images. */
export function listDvds(): Promise<string> {
    return vbox(["list", "dvds"]);
}

/** Returns machinereadable info for a VM. */
export function vmInfo(uuid: string): Promise<string> {
    assertUuid(uuid);
    return vbox(["showvminfo", uuid, "--machinereadable"]);
}

/** Returns human-readable info for a VM. */
export function vmInfoHuman(uuid: string): Promise<string> {
    assertUuid(uuid);
    return vbox(["showvminfo", uuid]);
}

const VALID_CONTROL_COMMANDS = new Set(["pause", "resume", "acpipowerbutton", "poweroff", "savestate"]);

/** Sends a control command to a running VM. */
export function controlVm(uuid: string, command: string): Promise<string> {
    assertUuid(uuid);
    if (!VALID_CONTROL_COMMANDS.has(command)) {
        throw new Error("Invalid VM control command: " + command);
    }
    return vbox(["controlvm", uuid, command]);
}

const VALID_START_TYPES = new Set(["headless", "gui"]);

/** Starts a VM in the requested mode ("headless" or "gui"). */
export function startVm(uuid: string, type: string): Promise<string> {
    assertUuid(uuid);
    if (!VALID_START_TYPES.has(type)) {
        throw new Error("Invalid VM start type: " + type);
    }
    return vbox(["startvm", uuid, "--type", type]);
}

/**
 * Lists snapshots of a VM in machinereadable format.
 *
 * VBoxManage reports "This machine does not have any snapshots" as a normal
 * condition, but depending on the version/exit-code path it may arrive as a
 * rejected promise with an empty or informational message. Treat both cases as
 * an empty snapshot list instead of an error.
 */
export function listSnapshots(uuid: string): Promise<string> {
    assertUuid(uuid);
    return vbox(["snapshot", uuid, "list", "--machinereadable"])
        .then((output) => {
            if (typeof output === "string" && /does not have any snapshots/i.test(output)) {
                return "";
            }
            return output;
        })
        .catch((e: any) => {
            const msg = (e && e.message) || String(e);
            if (!msg || /does not have any snapshots/i.test(msg)) {
                return "";
            }
            throw e;
        });
}

/** Creates a new snapshot for a VM. */
export function takeSnapshot(uuid: string, name: string): Promise<string> {
    assertUuid(uuid);
    if (!name || !name.trim()) {
        throw new Error("Snapshot name is empty");
    }
    return vbox(["snapshot", uuid, "take", name.trim()]);
}

/** Restores a VM to the specified snapshot. */
export function restoreSnapshot(uuid: string, name: string): Promise<string> {
    assertUuid(uuid);
    if (!name || !name.trim()) {
        throw new Error("Snapshot name is empty");
    }
    return vbox(["snapshot", uuid, "restore", name.trim()]);
}
