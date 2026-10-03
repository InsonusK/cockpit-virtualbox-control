import { getVmInfo as integrationGetVmInfo } from "./integration/getVmInfo.ts";

/** Returns whether the VM is configured to start automatically with the host. */
export async function getVmAutostart(uuid: string): Promise<boolean> {
    const info = await integrationGetVmInfo(uuid);
    return info.autostart === "on";
}
