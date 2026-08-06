import { vbox, assertUuid } from "./vbox.ts";
import type { VBoxCommandResult } from "./model.ts";

/** Toggles the VRDE server for a VM off then on, and returns a typed VirtualBox result. */
export async function restartVrde(uuid: string): Promise<VBoxCommandResult> {
    assertUuid(uuid);
    await vbox(["controlvm", uuid, "vrde", "off"]);
    const output = await vbox(["controlvm", uuid, "vrde", "on"]);
    return { output };
}
