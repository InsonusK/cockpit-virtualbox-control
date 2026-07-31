import { vbox } from "./vbox.ts";
import type { VBoxVm } from "./model.ts";

/** Lists VMs in `"Name" {uuid}` format and returns typed VirtualBox models. */
export async function listVms(): Promise<VBoxVm[]> {
    const output = await vbox(["list", "vms"]);

    const vms: VBoxVm[] = [];
    const re = /^"(.*)"\s+\{([0-9a-fA-F-]+)\}/gm;
    let match;
    while ((match = re.exec(output)) !== null) {
        vms.push({ name: match[1].replace(/\\"/g, '"'), uuid: match[2] });
    }
    return vms;
}
