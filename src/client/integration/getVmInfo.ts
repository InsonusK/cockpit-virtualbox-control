import { vbox, assertUuid } from "./vbox.ts";
import { parseKeyValue } from "./parseKeyValue.ts";
import type { VBoxVmInfo, VBoxNic, VBoxStorageAttachment, VBoxUsbFilter, VBoxSharedFolderMapping, VBoxPortForwardingRule } from "./model.ts";

/** Returns machinereadable info for a VM as a typed VirtualBox model. */
export async function getVmInfo(uuid: string): Promise<VBoxVmInfo> {
    assertUuid(uuid);
    const output = await vbox(["showvminfo", uuid, "--machinereadable"]);
    return parseVmInfo(output);
}

function parseVmInfo(output: string): VBoxVmInfo {
    const map = parseKeyValue(output);

    const nics: VBoxNic[] = [];
    for (let i = 1; i <= 8; i++) {
        const nic = map[`nic${i}`];
        if (!nic || nic === "none") continue;
        const portForwarding: VBoxPortForwardingRule[] = [];
        for (const key of Object.keys(map)) {
            const fm = key.match(/^Forwarding\((\d+)\)$/);
            if (fm) {
                const parts = map[key].split(",");
                if (parts.length >= 6) {
                    const [name, protocol, hostIp, hostPort, guestIp, guestPort] = parts;
                    portForwarding.push({ name, protocol, hostIp, hostPort, guestIp, guestPort });
                }
            }
        }
        nics.push({
            slot: i,
            type: nic,
            macAddress: map[`macaddress${i}`] || "",
            cableConnected: map[`cableconnected${i}`] || "",
            portForwarding,
        });
    }

    const storageAttachments: VBoxStorageAttachment[] = [];
    for (const key of Object.keys(map)) {
        if (key.includes("-ImageUUID-")) continue;
        const m = key.match(/^(.+)-(\d+)-(\d+)$/);
        if (!m) continue;
        const [, controllerName, port, device] = m;
        const path = map[key];
        if (!path || path === "none") continue;
        const imageUuid = map[`${controllerName}-ImageUUID-${port}-${device}`] || null;
        storageAttachments.push({
            controllerName,
            port: Number(port),
            device: Number(device),
            path,
            imageUuid,
        });
    }

    const usbFilters: VBoxUsbFilter[] = [];
    for (let i = 1; map[`USBFilterActive${i}`]; i++) {
        usbFilters.push({
            index: i,
            name: map[`USBFilterName${i}`] || "",
            vendorId: map[`USBFilterVendorId${i}`] || "",
            productId: map[`USBFilterProductId${i}`] || "",
            manufacturer: map[`USBFilterManufacturer${i}`] || "",
            product: map[`USBFilterProduct${i}`] || "",
            active: map[`USBFilterActive${i}`],
        });
    }

    const sharedFolderMappings: VBoxSharedFolderMapping[] = [];
    for (let i = 1; map[`SharedFolderNameMachineMapping${i}`]; i++) {
        sharedFolderMappings.push({
            index: i,
            name: map[`SharedFolderNameMachineMapping${i}`],
            hostPath: map[`SharedFolderPathMachineMapping${i}`] || "",
        });
    }

    return {
        name: map.name || "",
        vmState: map.VMState || "unknown",
        cpus: map.cpus || "",
        memory: map.memory || "",
        ostype: map.ostype || "",
        vrde: map.vrde || "",
        vrdePorts: map.vrdeports || "",
        nics,
        storageAttachments,
        usbFilters,
        sharedFolderMappings,
    };
}
