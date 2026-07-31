import { vbox, assertUuid } from "./vbox.ts";
import type { VBoxCommandResult } from "./model.ts";

/** Restores a VM to the specified snapshot and returns a typed VirtualBox result. */
export async function restoreSnapshot(uuid: string, name: string): Promise<VBoxCommandResult> {
    assertUuid(uuid);
    if (!name || !name.trim()) {
        throw new Error("Snapshot name is empty");
    }
    const output = await vbox(["snapshot", uuid, "restore", name.trim()]);
    return { output };
}
