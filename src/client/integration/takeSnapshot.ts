import { vbox, assertUuid } from "./vbox.ts";
import type { VBoxCommandResult } from "./model.ts";

/** Creates a new snapshot for a VM and returns a typed VirtualBox result. */
export async function takeSnapshot(uuid: string, name: string): Promise<VBoxCommandResult> {
    assertUuid(uuid);
    if (!name || !name.trim()) {
        throw new Error("Snapshot name is empty");
    }
    const output = await vbox(["snapshot", uuid, "take", name.trim()]);
    return { output };
}
