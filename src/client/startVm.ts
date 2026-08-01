import { startVm as integrationStartVm } from "./integration/startVm.ts";

/** Starts a VM in the requested mode. */
export async function startVm(uuid: string, type: string): Promise<void> {
    await integrationStartVm(uuid, type);
}
