export interface Vm {
    name: string;
    uuid: string;
}

export interface NetworkAdapter {
    slot: number;
    type: string;
    mac: string;
    enabled: boolean;
    portForwarding: string[];
}

export interface MediaItem {
    type: string;
    path: string;
    size: string;
}

export interface UsbFilter {
    label: string;
    active: boolean;
    autoConnect: boolean;
}

export interface SharedFolder {
    name: string;
    hostPath: string;
    guestPath: string;
    readOnly: boolean | null;
    autoMount: boolean | null;
}

export interface VmGeneralInfo {
    cpu: string;
    memory: string;
    os: string;
    vrdePort: string;
}

export interface VmDetails {
    general: VmGeneralInfo;
    networks: NetworkAdapter[];
    media: MediaItem[];
    usb: UsbFilter[];
    sharedFolders: SharedFolder[];
}

export interface MediumInfo {
    kind: "hdd" | "dvd";
    UUID?: string;
    Location?: string;
    Capacity?: string;
    Type?: string;
    [key: string]: string | undefined;
}
