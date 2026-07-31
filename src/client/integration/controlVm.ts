import { vbox, assertUuid } from "./vbox.ts";
import type { VBoxCommandResult } from "./model.ts";

const VALID_CONTROL_COMMANDS = new Set(["pause", "resume", "acpipowerbutton", "poweroff", "savestate"]);

/** Sends a control command to a running VM and returns a typed VirtualBox result. */
export async function controlVm(uuid: string, command: string): Promise<VBoxCommandResult> {
    assertUuid(uuid);
    if (!VALID_CONTROL_COMMANDS.has(command)) {
        throw new Error("Invalid VM control command: " + command);
    }
    const output = await vbox(["controlvm", uuid, command]);
    return { output };
}
