"use strict";

// Parses `VBoxManage list vms` output: "Name" {uuid}
function parseVmList(output) {
    const vms = [];
    const re = /^"(.*)"\s+\{([0-9a-fA-F-]+)\}/gm;
    let match;
    while ((match = re.exec(output)) !== null) {
        vms.push({ name: match[1], uuid: match[2] });
    }
    return vms;
}

// Parses machinereadable showvminfo output for the VMState field
function parseVmState(output) {
    const match = output.match(/^VMState="(.+)"$/m);
    return match ? match[1] : "unknown";
}

function parseKeyValue(output) {
    const map = {};
    const re = /^"?([^"=\n]+)"?\s*=\s*(.*)$/gm;
    let match;
    while ((match = re.exec(output)) !== null) {
        let value = match[2].trim();
        if (value.startsWith('"') && value.endsWith('"')) {
            value = value.slice(1, -1);
        }
        map[match[1].trim()] = value;
    }
    return map;
}

function parseMediumList(output, kind) {
    const items = [];
    if (!output) return items;
    const blocks = output.trim().split(/\n\s*\n/);
    for (const block of blocks) {
        const obj = { kind };
        const lines = block.trim().split("\n");
        for (const line of lines) {
            const m = line.match(/^([^:]+):\s*(.*)$/);
            if (m) obj[m[1].trim()] = m[2].trim();
        }
        if (obj.UUID) items.push(obj);
    }
    return items;
}

function parseSharedFolders(humanOutput) {
    const folders = [];
    const re = /Name:\s*'([^']+)'[,\s]+Host path:\s*'([^']+)'(?:\s*\([^)]+\))?[,\s]+(\S+)(?:[,\s]+(\S+))?/g;
    let match;
    while ((match = re.exec(humanOutput)) !== null) {
        const name = match[1];
        const hostPath = match[2];
        const flag1 = (match[3] || "").replace(/,$/, "");
        const flag2 = (match[4] || "").replace(/,$/, "");
        const flags = `${flag1} ${flag2}`.toLowerCase();
        folders.push({
            name,
            hostPath,
            guestPath: flags.includes("auto-mount") ? name : "—",
            readOnly: flags.includes("read-only"),
            autoMount: flags.includes("auto-mount"),
        });
    }
    return folders;
}

function parseVmDetails(infoOutput, hddsOutput, dvdsOutput, humanInfoOutput) {
    const map = parseKeyValue(infoOutput);

    const mediumByUuid = new Map();
    const mediumByLocation = new Map();
    for (const m of parseMediumList(hddsOutput, "hdd")) {
        mediumByUuid.set(m.UUID, m);
        mediumByLocation.set(m.Location, m);
    }
    for (const m of parseMediumList(dvdsOutput, "dvd")) {
        mediumByUuid.set(m.UUID, m);
        mediumByLocation.set(m.Location, m);
    }

    const general = {
        cpu: map.cpus || "—",
        memory: map.memory ? `${map.memory} МБ` : "—",
        os: map.ostype || "—",
        vrdePort: map.vrde === "on" && map.vrdeports
            ? map.vrdeports
            : (map.vrde === "off" ? "выключен" : (map.vrdeports || "—")),
    };

    const networks = [];
    const typeLabels = {
        nat: "NAT",
        bridged: "bridge",
        hostonly: "host-only",
        intnet: "internal",
        generic: "generic",
        null: "null",
    };
    for (let i = 1; i <= 8; i++) {
        const nic = map[`nic${i}`];
        if (!nic || nic === "none") continue;
        const type = nic.toLowerCase();
        const portForwarding = [];
        if (type === "nat") {
            for (const key of Object.keys(map)) {
                const fm = key.match(/^Forwarding\((\d+)\)$/);
                if (fm) {
                    const parts = map[key].split(",");
                    if (parts.length >= 6) {
                        const [rname, proto, hostIp, hostPort, guestIp, guestPort] = parts;
                        portForwarding.push(`${rname}: ${proto} ${hostIp || "*"}:${hostPort} → ${guestIp || "*"}:${guestPort}`);
                    }
                }
            }
        }
        networks.push({
            slot: i,
            type: typeLabels[type] || type.toUpperCase(),
            mac: map[`macaddress${i}`] || "—",
            enabled: map[`cableconnected${i}`] === "on",
            portForwarding,
        });
    }

    const media = [];
    for (const key of Object.keys(map)) {
        const m = key.match(/^([A-Za-z][A-Za-z0-9]*)-(\d+)-(\d+)$/);
        if (!m) continue;
        const [, controller, port, device] = m;
        const path = map[key];
        if (!path || path === "none") continue;
        const imageUuid = map[`${controller}-ImageUUID-${port}-${device}`];
        const medium = mediumByUuid.get(imageUuid) || mediumByLocation.get(path);
        let size = "—";
        let typeLabel = "HDD";
        if (medium) {
            size = medium.Capacity || "—";
            const t = (medium.Type || "").toLowerCase();
            if (medium.kind === "dvd" || t === "readonly" || path.toLowerCase().endsWith(".iso")) {
                typeLabel = "DVD/ISO";
            }
        } else if (path.toLowerCase().endsWith(".iso")) {
            typeLabel = "DVD/ISO";
        }
        media.push({ type: typeLabel, path, size });
    }

    const usb = [];
    for (let i = 1; map[`USBFilterActive${i}`]; i++) {
        const name = map[`USBFilterName${i}`] || "Без имени";
        const vendorId = map[`USBFilterVendorId${i}`] || "";
        const productId = map[`USBFilterProductId${i}`] || "";
        const manufacturer = map[`USBFilterManufacturer${i}`] || "";
        const product = map[`USBFilterProduct${i}`] || "";
        const active = map[`USBFilterActive${i}`] === "on";
        let label = name;
        const vendorPart = [manufacturer, product].filter(Boolean).join(" ").trim();
        if (vendorPart) label += ` (${vendorPart})`;
        if (vendorId || productId) label += ` [${vendorId}:${productId}]`;
        if (!active) label += " (отключен)";
        usb.push(label);
    }

    let sharedFolders = parseSharedFolders(humanInfoOutput);

    // Fallback: if human-readable showvminfo failed or didn't contain flags,
    // take shared folder names/paths from machine-readable output.
    if (sharedFolders.length === 0) {
        for (let i = 1; map[`SharedFolderNameMachineMapping${i}`]; i++) {
            const name = map[`SharedFolderNameMachineMapping${i}`];
            const hostPath = map[`SharedFolderPathMachineMapping${i}`] || "—";
            sharedFolders.push({
                name,
                hostPath,
                guestPath: name,
                readOnly: null,
                autoMount: null,
            });
        }
    }

    return { general, networks, media, usb, sharedFolders };
}
