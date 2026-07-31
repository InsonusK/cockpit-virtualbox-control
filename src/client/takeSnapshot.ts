import { takeSnapshot as integrationTakeSnapshot } from "./integration/takeSnapshot.ts";

/** Creates a new snapshot for a VM. */
export async function takeSnapshot(uuid: string, name: string): Promise<void> {
    await integrationTakeSnapshot(uuid, name);
}
