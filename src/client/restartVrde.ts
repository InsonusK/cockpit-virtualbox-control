import { restartVrde as integrationRestartVrde } from "./integration/restartVrde.ts";

/** Restarts the VRDE server for a VM (turns it off, then on). */
export async function restartVrde(uuid: string): Promise<void> {
    await integrationRestartVrde(uuid);
}
