import { vbox, assertUuid } from "./vbox.ts";
import type { VBoxCommandResult } from "./model.ts";

const VALID_START_TYPES = new Set(["headless", "gui"]);

/** Starts a VM in the requested mode and returns a typed VirtualBox result. */
export async function startVm(uuid: string, type: string): Promise<VBoxCommandResult> {
    assertUuid(uuid);
    if (!VALID_START_TYPES.has(type)) {
        throw new Error("Invalid VM start type: " + type);
    }
    const output = await vbox(["startvm", uuid, "--type", type]);
    return { output };
}
