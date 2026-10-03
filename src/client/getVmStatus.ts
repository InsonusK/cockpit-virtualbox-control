import { getVmInfo as integrationGetVmInfo } from "./integration/getVmInfo.ts";

/** VM state and autostart flag read from a single `showvminfo` call. */
export interface VmStatus {
    state: string;
    autostart: boolean;
}

/**
 * Returns the VM's power state and autostart flag from a single VBoxManage call.
 *
 * Combined into one call (rather than separate getVmState/getVmAutostart calls run in
 * parallel) because firing two concurrent `showvminfo` invocations per VM card made
 * VirtualBox's shared VM service intermittently fail one of them under load, randomly
 * marking VMs as "unknown" on refresh.
 */
export async function getVmStatus(uuid: string): Promise<VmStatus> {
    const info = await integrationGetVmInfo(uuid);
    return { state: info.vmState, autostart: info.autostart === "on" };
}
