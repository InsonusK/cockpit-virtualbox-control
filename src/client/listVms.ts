import { listVms as integrationListVms } from "./integration/listVms.ts";
import type { Vm } from "./model/index.ts";

/** Lists VMs in the application format. */
export async function listVms(): Promise<Vm[]> {
    const vms = await integrationListVms();
    return vms.map((vm) => ({ name: vm.name, uuid: vm.uuid }));
}
