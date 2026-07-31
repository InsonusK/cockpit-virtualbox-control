/** Result of a VBoxManage command that only produces text output. */
export interface VBoxCommandResult {
    output: string;
}

/** VM entry from `VBoxManage list vms`. */
export interface VBoxVm {
    name: string;
    uuid: string;
}

/** Medium entry from `VBoxManage list hdds` / `list dvds`. */
export interface VBoxMedium {
    kind: "hdd" | "dvd";
    uuid: string;
    parentUuid: string;
    state: string;
    type: string;
    location: string;
    storageFormat: string;
    capacity: string;
    encryption: string;
    [key: string]: string | undefined | "hdd" | "dvd";
}

/** Machine-readable `VBoxManage showvminfo` output converted to a typed model. */
export interface VBoxVmInfo extends VBoxVmGeneralInfo {
    nics: VBoxNic[];
    storageAttachments: VBoxStorageAttachment[];
    usbFilters: VBoxUsbFilter[];
    sharedFolderMappings: VBoxSharedFolderMapping[];
}

/** General section of a machine-readable `VBoxManage showvminfo` output. */
export interface VBoxVmGeneralInfo {
    name: string;
    vmState: string;
    cpus: string;
    memory: string;
    ostype: string;
    vrde: string;
    vrdePorts: string;
}

/** Network adapter from machinereadable showvminfo. */
export interface VBoxNic {
    slot: number;
    type: string;
    macAddress: string;
    cableConnected: string;
    portForwarding: VBoxPortForwardingRule[];
}

/** Port forwarding rule from machinereadable showvminfo. */
export interface VBoxPortForwardingRule {
    name: string;
    protocol: string;
    hostIp: string;
    hostPort: string;
    guestIp: string;
    guestPort: string;
}

/** Storage attachment from machinereadable showvminfo. */
export interface VBoxStorageAttachment {
    controllerName: string;
    port: number;
    device: number;
    path: string;
    imageUuid: string | null;
}

/** USB filter from machinereadable showvminfo. */
export interface VBoxUsbFilter {
    index: number;
    name: string;
    vendorId: string;
    productId: string;
    manufacturer: string;
    product: string;
    active: string;
}

/** Shared folder machine mapping from machinereadable showvminfo. */
export interface VBoxSharedFolderMapping {
    index: number;
    name: string;
    hostPath: string;
}

/** Shared folder from human-readable `VBoxManage showvminfo`. */
export interface VBoxSharedFolder {
    name: string;
    hostPath: string;
    flags: string[];
}

/** Snapshot entry from `VBoxManage snapshot list --machinereadable`. */
export interface VBoxSnapshot {
    name: string;
}
