import type { NetworkAdapter } from "./network.ts";
import type { MediaItem, MediumInfo } from "./media.ts";
import type { UsbFilter } from "./usb.ts";
import type { SharedFolder } from "./sharedFolder.ts";

/** A VirtualBox VM as presented to the application. */
export interface Vm {
    name: string;
    uuid: string;
}

/** General information about a VM. */
export interface VmGeneralInfo {
    cpu: string;
    memory: string;
    os: string;
    vrdePort: string;
}

/** Full VM details assembled for the application. */
export interface VmDetails {
    general: VmGeneralInfo;
    networks: NetworkAdapter[];
    media: MediaItem[];
    usb: UsbFilter[];
    sharedFolders: SharedFolder[];
}

export type { NetworkAdapter, MediaItem, MediumInfo, UsbFilter, SharedFolder };
