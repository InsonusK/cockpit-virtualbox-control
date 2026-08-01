import { getVmInfo as integrationGetVmInfo } from "./integration/getVmInfo.ts";

/** Returns the VM state in the application format. */
export async function getVmState(uuid: string): Promise<string> {
    const info = await integrationGetVmInfo(uuid);
    return info.vmState;
}
