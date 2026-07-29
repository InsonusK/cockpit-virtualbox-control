"use strict";

const vmListEl = document.getElementById("vm-list");
const statusEl = document.getElementById("status-msg");
const refreshBtn = document.getElementById("refresh-btn");

function setStatus(msg, isError) {
    statusEl.textContent = msg || "";
    statusEl.style.color = isError ? "var(--red)" : "var(--text-dim)";
}

async function loadVms() {
    setStatus("Загрузка...");
    try {
        const listOutput = await listVms();
        const vms = parseVmList(listOutput);

        const withState = await Promise.all(vms.map(async (vm) => {
            try {
                const info = await vmInfo(vm.uuid);
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
        const callbacks = {
            onToggleDetails: toggleVmDetails,
            onControl: runControlAction,
            onStart: runStartAction,
            onSnapshots: (vm) => SnapshotModal.open(vm, setStatus),
        };
        vmListEl.appendChild(renderVmCard(vm, callbacks));
    }
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
        const [info, hdds, dvds] = await Promise.all([
            vmInfo(vm.uuid),
            listHdds(),
            listDvds(),
        ]);

        let humanInfo = "";
        try {
            humanInfo = await vmInfoHuman(vm.uuid);
        } catch (e) {
            // Human-readable showvminfo may fail for locked VMs.
            // We still can show most details; shared folder flags become unknown.
            console.warn("vmInfoHuman failed for", vm.uuid, e.message || e);
        }

        vm.details = parseVmDetails(info, hdds, dvds, humanInfo);
        detailsEl.innerHTML = renderDetails(vm.details);
    } catch (e) {
        detailsEl.innerHTML = '<p class="empty-msg">Не удалось загрузить детали</p>';
        setStatus("Ошибка: " + (e.message || e), true);
    }
}

async function runControlAction(vm, command) {
    setStatus(`Выполняется: controlvm ${command}...`);
    try {
        await controlVm(vm.uuid, command);
        setStatus(`Готово: ${vm.name}`);
    } catch (e) {
        setStatus("Ошибка: " + (e.message || e), true);
    }
    await loadVms();
}

async function runStartAction(vm, type) {
    setStatus(`Выполняется: startvm --type ${type}...`);
    try {
        await startVm(vm.uuid, type);
        setStatus(`Готово: ${vm.name}`);
    } catch (e) {
        setStatus("Ошибка: " + (e.message || e), true);
    }
    await loadVms();
}

refreshBtn.onclick = loadVms;

loadVms();
