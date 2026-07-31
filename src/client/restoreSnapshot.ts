import { restoreSnapshot as integrationRestoreSnapshot } from "./integration/restoreSnapshot.ts";

/** Restores a VM to the specified snapshot. */
export async function restoreSnapshot(uuid: string, name: string): Promise<void> {
    await integrationRestoreSnapshot(uuid, name);
}
