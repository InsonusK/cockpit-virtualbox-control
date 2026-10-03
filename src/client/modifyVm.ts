import { modifyVm as integrationModifyVm } from "./integration/index.ts";
import type { ModifyVmOptions } from "./integration/index.ts";

export type { ModifyVmOptions, UsbFilterInput, SharedFolderInput } from "./integration/index.ts";

/** Applies edited settings to an existing VM. */
export async function modifyVm(
    uuid: string,
    existingUsbFilterCount: number,
    existingSharedFolderNames: string[],
    options: ModifyVmOptions,
): Promise<void> {
    await integrationModifyVm(uuid, existingUsbFilterCount, existingSharedFolderNames, options);
}
