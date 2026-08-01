import {
    getVmInfo as integrationGetVmInfo,
    listHdds as integrationListHdds,
    listDvds as integrationListDvds,
    getVmInfoHuman as integrationGetVmInfoHuman,
} from "./integration/index.ts";
import type { VBoxMedium } from "./integration/model.ts";
import type { VmDetails, NetworkAdapter, MediaItem, UsbFilter, SharedFolder } from "./model/index.ts";

/** Loads and aggregates VM details in the application format. */
export async function getVmDetails(uuid: string): Promise<VmDetails> {
    const [info, hdds, dvds, humanFolders] = await Promise.all([
        integrationGetVmInfo(uuid),
        integrationListHdds(),
        integrationListDvds(),
        integrationGetVmInfoHuman(uuid).catch(() => []),
    ]);

    const mediumByUuid = new Map<string, VBoxMedium>();
    const mediumByLocation = new Map<string, VBoxMedium>();
    for (const m of hdds) {
        if (m.uuid) mediumByUuid.set(m.uuid, m);
        if (m.location) mediumByLocation.set(m.location, m);
    }
    for (const m of dvds) {
        if (m.uuid) mediumByUuid.set(m.uuid, m);
        if (m.location) mediumByLocation.set(m.location, m);
    }

    const general = {
        cpu: info.cpus || "—",
        memory: info.memory ? `${info.memory} МБ` : "—",
        os: info.ostype || "—",
        vrdePort: info.vrde === "on" && info.vrdePorts
            ? info.vrdePorts
            : (info.vrde === "off" ? "выключен" : (info.vrdePorts || "—")),
    };

    const networks: NetworkAdapter[] = [];
    const typeLabels: Record<string, string> = {
        nat: "NAT",
        bridged: "bridge",
        hostonly: "host-only",
        intnet: "internal",
        generic: "generic",
        null: "null",
    };
    for (const nic of info.nics) {
        const type = nic.type.toLowerCase();
        networks.push({
            slot: nic.slot,
            type: typeLabels[type] || type.toUpperCase(),
            mac: nic.macAddress || "—",
            enabled: nic.cableConnected === "on",
            portForwarding: nic.portForwarding.map((rule) =>
                `${rule.name}: ${rule.protocol} ${rule.hostIp || "*"}:${rule.hostPort} → ${rule.guestIp || "*"}:${rule.guestPort}`
            ),
        });
    }

    const media: MediaItem[] = [];
    for (const att of info.storageAttachments) {
        const medium = att.imageUuid ? mediumByUuid.get(att.imageUuid) : null;
        const mediumByPath = medium || mediumByLocation.get(att.path);
        let size = "—";
        let typeLabel = "HDD";
        if (mediumByPath) {
            size = mediumByPath.capacity || "—";
            const t = (mediumByPath.type || "").toLowerCase();
            if (mediumByPath.kind === "dvd" || t === "readonly" || att.path.toLowerCase().endsWith(".iso")) {
                typeLabel = "DVD/ISO";
            }
        } else if (att.path.toLowerCase().endsWith(".iso") || att.path.toLowerCase() === "emptydrive") {
            typeLabel = "DVD/ISO";
        }
        media.push({ type: typeLabel, path: att.path, size });
    }

    const usb: UsbFilter[] = info.usbFilters.map((filter) => {
        let label = filter.name || "Без имени";
        const vendorPart = [filter.manufacturer, filter.product].filter(Boolean).join(" ").trim();
        if (vendorPart) label += ` (${vendorPart})`;
        if (filter.vendorId || filter.productId) label += ` [${filter.vendorId}:${filter.productId}]`;
        return { label, active: filter.active === "on", autoConnect: filter.active === "on" };
    });

    let sharedFolders: SharedFolder[] = humanFolders.map((folder) => {
        const flags = folder.flags.map((f) => f.toLowerCase());
        return {
            name: folder.name,
            hostPath: folder.hostPath,
            guestPath: flags.includes("auto-mount") ? folder.name : "—",
            readOnly: flags.includes("read-only") || flags.includes("readonly"),
            autoMount: flags.includes("auto-mount"),
        };
    });

    if (sharedFolders.length === 0) {
        sharedFolders = info.sharedFolderMappings.map((mapping) => ({
            name: mapping.name,
            hostPath: mapping.hostPath || "—",
            guestPath: mapping.name,
            readOnly: null,
            autoMount: null,
        }));
    }

    return { general, networks, media, usb, sharedFolders };
}
