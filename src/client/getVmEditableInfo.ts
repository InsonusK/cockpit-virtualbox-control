import {
    getVmInfo as integrationGetVmInfo,
    getVmInfoHuman as integrationGetVmInfoHuman,
} from "./integration/index.ts";
import { buildSharedFolders } from "./getVmDetails.ts";

export interface EditableUsbFilter {
    name: string;
    vendorId: string;
    productId: string;
    active: boolean;
}

export interface EditableSharedFolder {
    name: string;
    hostPath: string;
    readOnly: boolean;
    autoMount: boolean;
}

/** Current VM settings in a shape suitable for pre-filling the edit form. */
export interface VmEditableInfo {
    memory: number;
    cpus: number;
    vrdeEnabled: boolean;
    vrdePort: string;
    autostart: boolean;
    usbFilters: EditableUsbFilter[];
    sharedFolders: EditableSharedFolder[];
}

/** Loads a VM's current settings for editing, including raw USB filter and shared folder data. */
export async function getVmEditableInfo(uuid: string): Promise<VmEditableInfo> {
    const [info, humanFolders] = await Promise.all([
        integrationGetVmInfo(uuid),
        integrationGetVmInfoHuman(uuid).catch(() => []),
    ]);

    const sharedFolders = buildSharedFolders(humanFolders, info.sharedFolderMappings).map((sf) => ({
        name: sf.name,
        hostPath: sf.hostPath === "—" ? "" : sf.hostPath,
        readOnly: Boolean(sf.readOnly),
        autoMount: Boolean(sf.autoMount),
    }));

    return {
        memory: Number(info.memory) || 0,
        cpus: Number(info.cpus) || 0,
        vrdeEnabled: info.vrde === "on",
        vrdePort: info.vrdePorts || "3390",
        autostart: info.autostart === "on",
        usbFilters: info.usbFilters.map((f) => ({
            name: f.name,
            vendorId: f.vendorId,
            productId: f.productId,
            active: f.active === "on",
        })),
        sharedFolders,
    };
}
