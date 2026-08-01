import { controlVm as integrationControlVm } from "./integration/controlVm.ts";

/** Sends a control command to a running VM. */
export async function controlVm(uuid: string, command: string): Promise<void> {
    await integrationControlVm(uuid, command);
}
