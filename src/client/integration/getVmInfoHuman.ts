import { vbox, assertUuid } from "./vbox.ts";
import type { VBoxSharedFolder } from "./model.ts";

/** Returns human-readable shared folders for a VM as typed VirtualBox models. */
export async function getVmInfoHuman(uuid: string): Promise<VBoxSharedFolder[]> {
    assertUuid(uuid);
    const output = await vbox(["showvminfo", uuid]);
    return parseSharedFolders(output);
}

function parseSharedFolders(humanOutput: string): VBoxSharedFolder[] {
    const folders: VBoxSharedFolder[] = [];
    const re = /Name:\s*'([^']+)'[,\s]+Host path:\s*'([^']+)'(?:\s*\([^)]+\))?[,\s]+(\S+)(?:[,\s]+(\S+))?/g;
    let match;
    while ((match = re.exec(humanOutput)) !== null) {
        const name = match[1];
        const hostPath = match[2];
        const flag1 = (match[3] || "").replace(/,$/, "").toLowerCase();
        const flag2 = (match[4] || "").replace(/,$/, "").toLowerCase();
        const flags = [flag1, flag2].filter(Boolean);
        folders.push({ name, hostPath, flags });
    }
    return folders;
}
