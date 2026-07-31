const UUID_RE = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

/** Validates that a string is a UUID. */
export function assertUuid(uuid: string): void {
    if (!UUID_RE.test(uuid)) {
        throw new Error("Invalid VM UUID: " + uuid);
    }
}

/**
 * Runs `VBoxManage` through `cockpit.spawn` with a fixed environment.
 *
 * All public functions must pass arguments as an array to avoid shell injection.
 */
export function vbox(args: string[]): Promise<string> {
    if (typeof cockpit === "undefined") {
        throw new Error("cockpit is not available: ensure the plugin is opened from Cockpit and ../base1/cockpit.js is loaded");
    }
    return cockpit.spawn(["VBoxManage", ...args], {
        err: "message",
        environ: ["LC_ALL=C"],
    });
}
