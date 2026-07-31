import { listSnapshots as integrationListSnapshots } from "./integration/listSnapshots.ts";

/** Lists snapshot names for a VM. */
export async function listSnapshots(uuid: string): Promise<string[]> {
    const snapshots = await integrationListSnapshots(uuid);
    return snapshots.map((snapshot) => snapshot.name);
}
