import { vbox, assertUuid } from "./vbox.ts";
import type { VBoxSnapshot } from "./model.ts";

/**
 * Lists snapshots of a VM in machinereadable format and returns typed VirtualBox models.
 *
 * VBoxManage reports "This machine does not have any snapshots" as a normal
 * condition, but depending on the version/exit-code path it may arrive as a
 * rejected promise with an empty or informational message. Treat both cases as
 * an empty snapshot list instead of an error.
 */
export async function listSnapshots(uuid: string): Promise<VBoxSnapshot[]> {
    assertUuid(uuid);
    const output = await vbox(["snapshot", uuid, "list", "--machinereadable"])
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

    return parseSnapshotList(output);
}

function parseSnapshotList(output: string): VBoxSnapshot[] {
    const snapshots: VBoxSnapshot[] = [];
    const re = /^SnapshotName(-\d+)?="(.*)"$/gm;
    let match;
    while ((match = re.exec(output)) !== null) {
        snapshots.push({ name: match[2] });
    }
    return snapshots;
}
