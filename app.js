"use strict";

const vmListEl = document.getElementById("vm-list");
const statusEl = document.getElementById("status-msg");
const refreshBtn = document.getElementById("refresh-btn");

const snapshotModal = document.getElementById("snapshot-modal");
const snapshotTitle = document.getElementById("snapshot-title");
const snapshotListEl = document.getElementById("snapshot-list");
const snapshotNameInput = document.getElementById("snapshot-name");
const snapshotTakeBtn = document.getElementById("snapshot-take-btn");
const snapshotCloseBtn = document.getElementById("snapshot-close-btn");

let currentSnapshotVm = null;

function vbox(args) {
    return cockpit.spawn(["VBoxManage", ...args], {
        err: "message",
        environ: ["LC_ALL=C"],
    });
}

function setStatus(msg, isError) {
    statusEl.textContent = msg || "";
    statusEl.style.color = isError ? "var(--red)" : "var(--text-dim)";
}

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

function stateDotClass(state) {
    if (state === "running") return "dot-running";
    if (state === "paused") return "dot-paused";
    return "dot-off";
}

function stateLabel(state) {
    const map = {
        running: "Запущена",
        paused: "На паузе",
        poweroff: "Выключена",
        saved: "Сохранено состояние",
        aborted: "Аварийно завершена",
    };
    return map[state] || state;
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
        vrdePort: map.vrde === "on" && map.vrdeports ? map.vrdeports : (map.vrde === "off" ? "выключен" : (map.vrdeports || "—")),
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

    const sharedFolders = parseSharedFolders(humanInfoOutput);

    return { general, networks, media, usb, sharedFolders };
}

function renderDetails(vm) {
    if (!vm.details) {
        return '<p class="empty-msg">Загрузка деталей...</p>';
    }
    const { general, networks, media, usb, sharedFolders } = vm.details;

    const networkHtml = networks.length
        ? networks.map(n => `
            <div class="detail-sub">
                <strong>Adapter ${n.slot}</strong> — ${n.type}, ${n.enabled ? "включена" : "отключена"}, MAC: ${n.mac}
                ${n.portForwarding.length ? `<ul>${n.portForwarding.map(pf => `<li>${escapeHtml(pf)}</li>`).join("")}</ul>` : '<p class="empty-msg">Без проброса портов</p>'}
            </div>
        `).join("")
        : '<p class="empty-msg">Нет настроенных сетей</p>';

    const mediaHtml = media.length
        ? `<table class="detail-table">
            <thead><tr><th>Тип</th><th>Путь</th><th>Размер</th></tr></thead>
            <tbody>${media.map(m => `<tr><td>${m.type}</td><td>${escapeHtml(m.path)}</td><td>${escapeHtml(m.size)}</td></tr>`).join("")}</tbody>
           </table>`
        : '<p class="empty-msg">Нет носителей</p>';

    const usbHtml = usb.length
        ? `<ul>${usb.map(u => `<li>${escapeHtml(u)}</li>`).join("")}</ul>`
        : '<p class="empty-msg">Нет USB устройств</p>';

    const sfHtml = sharedFolders.length
        ? `<table class="detail-table">
            <thead><tr><th>Название</th><th>Путь на хосте</th><th>Путь в гостевой ОС</th><th>Только чтение</th><th>Автоподключение</th></tr></thead>
            <tbody>${sharedFolders.map(sf => `<tr>
                <td>${escapeHtml(sf.name)}</td>
                <td>${escapeHtml(sf.hostPath)}</td>
                <td>${escapeHtml(sf.guestPath)}</td>
                <td>${sf.readOnly ? "да" : "нет"}</td>
                <td>${sf.autoMount ? "да" : "нет"}</td>
            </tr>`).join("")}</tbody>
           </table>`
        : '<p class="empty-msg">Нет общих папок</p>';

    return `
        <div class="detail-section">
            <h3>Общая</h3>
            <div class="detail-grid">
                <div><span>CPU:</span> ${general.cpu}</div>
                <div><span>Memory:</span> ${general.memory}</div>
                <div><span>ОС:</span> ${escapeHtml(general.os)}</div>
                <div><span>VRDE port:</span> ${escapeHtml(general.vrdePort)}</div>
            </div>
        </div>
        <div class="detail-section">
            <h3>Сети</h3>
            ${networkHtml}
        </div>
        <div class="detail-section">
            <h3>Носители</h3>
            ${mediaHtml}
        </div>
        <div class="detail-section">
            <h3>USB устройства</h3>
            ${usbHtml}
        </div>
        <div class="detail-section">
            <h3>Общие папки</h3>
            ${sfHtml}
        </div>
    `;
}

async function toggleVmDetails(vm, detailsEl, cardEl) {
    const isExpanded = cardEl.classList.contains("expanded");
    if (isExpanded) {
        cardEl.classList.remove("expanded");
        detailsEl.innerHTML = "";
        return;
    }

    detailsEl.innerHTML = '<p class="empty-msg">Загрузка деталей...</p>';
    cardEl.classList.add("expanded");

    try {
        const [info, hdds, dvds, humanInfo] = await Promise.all([
            vbox(["showvminfo", vm.uuid, "--machinereadable"]),
            vbox(["list", "hdds"]),
            vbox(["list", "dvds"]),
            vbox(["showvminfo", vm.uuid]),
        ]);
        vm.details = parseVmDetails(info, hdds, dvds, humanInfo);
        detailsEl.innerHTML = renderDetails(vm);
    } catch (e) {
        detailsEl.innerHTML = '<p class="empty-msg">Не удалось загрузить детали</p>';
        setStatus("Ошибка: " + (e.message || e), true);
    }
}

async function loadVms() {
    setStatus("Загрузка...");
    try {
        const listOutput = await vbox(["list", "vms"]);
        const vms = parseVmList(listOutput);

        const withState = await Promise.all(vms.map(async (vm) => {
            try {
                const info = await vbox(["showvminfo", vm.uuid, "--machinereadable"]);
                vm.state = parseVmState(info);
            } catch (e) {
                vm.state = "unknown";
            }
            return vm;
        }));

        renderVms(withState);
        setStatus("Обновлено: " + new Date().toLocaleTimeString());
    } catch (e) {
        setStatus("Ошибка: " + (e.message || e), true);
        vmListEl.innerHTML = "";
    }
}

function renderVms(vms) {
    vmListEl.innerHTML = "";

    if (vms.length === 0) {
        vmListEl.innerHTML = '<p class="empty-msg">Виртуальные машины не найдены.</p>';
        return;
    }

    for (const vm of vms) {
        const card = document.createElement("div");
        card.className = "vm-card";

        const header = document.createElement("div");
        header.className = "vm-header";
        header.title = "Нажмите для просмотра деталей";

        const info = document.createElement("div");
        info.className = "vm-info";
        info.innerHTML = `
            <span class="vm-name">${escapeHtml(vm.name)}</span>
            <span class="vm-state">
                <span class="dot ${stateDotClass(vm.state)}"></span>
                ${stateLabel(vm.state)}
            </span>
        `;

        const actions = document.createElement("div");
        actions.className = "vm-actions";
        actions.appendChild(buildActionButtons(vm));

        header.appendChild(info);
        header.appendChild(actions);

        const details = document.createElement("div");
        details.className = "vm-details";

        header.onclick = () => toggleVmDetails(vm, details, card);

        card.appendChild(header);
        card.appendChild(details);
        vmListEl.appendChild(card);
    }
}

function buildActionButtons(vm) {
    const frag = document.createDocumentFragment();

    const addBtn = (label, cls, handler) => {
        const b = document.createElement("button");
        b.className = "btn btn-small " + (cls || "");
        b.textContent = label;
        b.onclick = (e) => {
            e.stopPropagation();
            handler();
        };
        frag.appendChild(b);
    };

    if (vm.state === "running") {
        addBtn("Пауза", "", () => runAction(vm, ["controlvm", vm.uuid, "pause"]));
        addBtn("ACPI выключение", "", () => runAction(vm, ["controlvm", vm.uuid, "acpipowerbutton"]));
        addBtn("Force off", "btn-danger", () => runAction(vm, ["controlvm", vm.uuid, "poweroff"]));
    } else if (vm.state === "paused") {
        addBtn("Продолжить", "", () => runAction(vm, ["controlvm", vm.uuid, "resume"]));
        addBtn("Force off", "btn-danger", () => runAction(vm, ["controlvm", vm.uuid, "poweroff"]));
    } else {
        addBtn("Запустить (headless)", "", () => runAction(vm, ["startvm", vm.uuid, "--type", "headless"]));
        addBtn("Запустить (GUI)", "", () => runAction(vm, ["startvm", vm.uuid, "--type", "gui"]));
    }

    addBtn("Снапшоты", "btn-secondary", () => openSnapshots(vm));

    return frag;
}

async function runAction(vm, args) {
    setStatus(`Выполняется: ${args.join(" ")}...`);
    try {
        await vbox(args);
        setStatus(`Готово: ${vm.name}`);
    } catch (e) {
        setStatus("Ошибка: " + (e.message || e), true);
    }
    await loadVms();
}

// --- Snapshots ---

function parseSnapshotList(output) {
    // Lines like: SnapshotName="Before update"
    const names = [];
    const re = /^SnapshotName(-\d+)?="(.*)"$/gm;
    let match;
    while ((match = re.exec(output)) !== null) {
        names.push(match[2]);
    }
    return names;
}

async function openSnapshots(vm) {
    currentSnapshotVm = vm;
    snapshotTitle.textContent = "Снапшоты: " + vm.name;
    snapshotNameInput.value = "";
    snapshotModal.classList.remove("hidden");
    await refreshSnapshots();
}

async function refreshSnapshots() {
    snapshotListEl.innerHTML = '<p class="empty-msg">Загрузка...</p>';
    try {
        const output = await vbox(["snapshot", currentSnapshotVm.uuid, "list", "--machinereadable"]);
        const names = parseSnapshotList(output);
        renderSnapshots(names);
    } catch (e) {
        // No snapshots yet returns an error from VBoxManage - treat as empty
        renderSnapshots([]);
    }
}

function renderSnapshots(names) {
    snapshotListEl.innerHTML = "";
    if (names.length === 0) {
        snapshotListEl.innerHTML = '<p class="empty-msg">Снапшотов пока нет.</p>';
        return;
    }
    for (const name of names) {
        const row = document.createElement("div");
        row.className = "snapshot-item";
        row.innerHTML = `<span>${escapeHtml(name)}</span>`;

        const restoreBtn = document.createElement("button");
        restoreBtn.className = "btn btn-small";
        restoreBtn.textContent = "Восстановить";
        restoreBtn.onclick = () => restoreSnapshot(name);

        row.appendChild(restoreBtn);
        snapshotListEl.appendChild(row);
    }
}

async function restoreSnapshot(name) {
    setStatus("Восстановление снапшота...");
    try {
        await vbox(["snapshot", currentSnapshotVm.uuid, "restore", name]);
        setStatus("Снапшот восстановлен");
    } catch (e) {
        setStatus("Ошибка: " + (e.message || e), true);
    }
    await refreshSnapshots();
    await loadVms();
}

snapshotTakeBtn.onclick = async () => {
    const name = snapshotNameInput.value.trim();
    if (!name) return;
    setStatus("Создание снапшота...");
    try {
        await vbox(["snapshot", currentSnapshotVm.uuid, "take", name]);
        setStatus("Снапшот создан");
        snapshotNameInput.value = "";
    } catch (e) {
        setStatus("Ошибка: " + (e.message || e), true);
    }
    await refreshSnapshots();
};

snapshotCloseBtn.onclick = () => {
    snapshotModal.classList.add("hidden");
    currentSnapshotVm = null;
};

function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
}

refreshBtn.onclick = loadVms;

loadVms();