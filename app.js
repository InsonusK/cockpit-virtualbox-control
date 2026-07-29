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
    return cockpit.spawn(["VBoxManage", ...args], { err: "message" });
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

        card.appendChild(info);
        card.appendChild(actions);
        vmListEl.appendChild(card);
    }
}

function buildActionButtons(vm) {
    const frag = document.createDocumentFragment();

    const addBtn = (label, cls, handler) => {
        const b = document.createElement("button");
        b.className = "btn btn-small " + (cls || "");
        b.textContent = label;
        b.onclick = handler;
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