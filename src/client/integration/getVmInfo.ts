import { vbox, assertUuid } from "./vbox.ts";
import { parseKeyValue } from "./parseKeyValue.ts";
import type {
    VBoxVmInfo,
    VBoxNic,
    VBoxPortForwardingRule,
    VBoxStorageAttachment,
    VBoxUsbFilter,
    VBoxSharedFolderMapping,
    VBoxVmGeneralInfo,
} from "./model.ts";

/** Returns machinereadable info for a VM as a typed VirtualBox model. */
export async function getVmInfo(uuid: string): Promise<VBoxVmInfo> {
    assertUuid(uuid);
    const output = await vbox(["showvminfo", uuid, "--machinereadable"]);
    return parseVmInfo(output);
}

/** Parses machinereadable `VBoxManage showvminfo` output into a typed VirtualBox model. */
export function parseVmInfo(output: string): VBoxVmInfo {
    const map = parseKeyValue(output);

    return {
        ...parseVmGeneralInfo(map),
        nics: parseVmNics(map),
        storageAttachments: parseVmStorageAttachments(map),
        usbFilters: parseVmUsbFilters(map),
        sharedFolderMappings: parseVmSharedFolderMappings(map),
    };
}

/** Extracts general VM info from a key=value map. */
export function parseVmGeneralInfo(map: Record<string, string>): VBoxVmGeneralInfo {
    return {
        name: map.name || "",
        vmState: map.VMState || "unknown",
        cpus: map.cpus || "",
        memory: map.memory || "",
        ostype: map.ostype || "",
        vrde: map.vrde || "",
        vrdePorts: map.vrdeports || "",
    };
}

/** Parses network adapters from a key=value map. */
export function parseVmNics(map: Record<string, string>): VBoxNic[] {
    const nics: VBoxNic[] = [];
    for (let i = 1; i <= 8; i++) {
        const nic = map[`nic${i}`];
        if (!nic || nic === "none") continue;
        nics.push({
            slot: i,
            type: nic,
            macAddress: map[`macaddress${i}`] || "",
            cableConnected: map[`cableconnected${i}`] || "",
            portForwarding: parsePortForwarding(map),
        });
    }
    return nics;
}

function parsePortForwarding(map: Record<string, string>): VBoxPortForwardingRule[] {
    const rules: VBoxPortForwardingRule[] = [];
    for (const key of Object.keys(map)) {
        const fm = key.match(/^Forwarding\((\d+)\)$/);
        if (!fm) continue;
        const parts = map[key].split(",");
        if (parts.length < 6) continue;
        const [name, protocol, hostIp, hostPort, guestIp, guestPort] = parts;
        rules.push({ name, protocol, hostIp, hostPort, guestIp, guestPort });
    }
    return rules;
}

/** Parses storage attachments from a key=value map. */
export function parseVmStorageAttachments(map: Record<string, string>): VBoxStorageAttachment[] {
    const attachments: VBoxStorageAttachment[] = [];

    for (const key of Object.keys(map)) {
        const value = map[key];
        if (!value || value === "none") continue;
        if (value !== "emptydrive" && !value.includes("/")) continue;

        const { controllerName, port, device } = splitStorageAttachmentKey(key);
        if (!controllerName) continue;

        const imageUuid = map[`${controllerName}-ImageUUID-${port}-${device}`] || null;
        attachments.push({ controllerName, port, device, path: value, imageUuid });
    }

    return attachments;
}

function splitStorageAttachmentKey(key: string): { controllerName: string | null; port: number; device: number } {
    const parts = key.split("-");
    if (parts.length < 3) return { controllerName: null, port: 0, device: 0 };

    const last = parts[parts.length - 1];
    const secondLast = parts[parts.length - 2];
    if (!/^\d+$/.test(last) || !/^\d+$/.test(secondLast)) {
        return { controllerName: null, port: 0, device: 0 };
    }

    const controllerName = parts.slice(0, -2).join("-");
    return { controllerName, port: Number(secondLast), device: Number(last) };
}

/** Parses USB filters from a key=value map. */
export function parseVmUsbFilters(map: Record<string, string>): VBoxUsbFilter[] {
    const filters: VBoxUsbFilter[] = [];
    for (let i = 1; map[`USBFilterActive${i}`]; i++) {
        filters.push({
            index: i,
            name: map[`USBFilterName${i}`] || "",
            vendorId: map[`USBFilterVendorId${i}`] || "",
            productId: map[`USBFilterProductId${i}`] || "",
            manufacturer: map[`USBFilterManufacturer${i}`] || "",
            product: map[`USBFilterProduct${i}`] || "",
            active: map[`USBFilterActive${i}`],
        });
    }
    return filters;
}

/** Parses shared folder machine mappings from a key=value map. */
export function parseVmSharedFolderMappings(map: Record<string, string>): VBoxSharedFolderMapping[] {
    const mappings: VBoxSharedFolderMapping[] = [];
    for (let i = 1; map[`SharedFolderNameMachineMapping${i}`]; i++) {
        mappings.push({
            index: i,
            name: map[`SharedFolderNameMachineMapping${i}`],
            hostPath: map[`SharedFolderPathMachineMapping${i}`] || "",
        });
    }
    return mappings;
}
