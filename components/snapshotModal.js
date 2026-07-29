"use strict";

const SnapshotModal = (function () {
    const modal = document.getElementById("snapshot-modal");
    const title = document.getElementById("snapshot-title");
    const listEl = document.getElementById("snapshot-list");
    const nameInput = document.getElementById("snapshot-name");
    const takeBtn = document.getElementById("snapshot-take-btn");
    const closeBtn = document.getElementById("snapshot-close-btn");

    let currentVm = null;
    let onStatus = null;

    function parseSnapshotList(output) {
        const names = [];
        const re = /^SnapshotName(-\d+)?="(.*)"$/gm;
        let match;
        while ((match = re.exec(output)) !== null) {
            names.push(match[2]);
        }
        return names;
    }

    function renderSnapshots(names) {
        listEl.innerHTML = "";
        if (names.length === 0) {
            listEl.innerHTML = '<p class="empty-msg">Снапшотов пока нет.</p>';
            return;
        }
        for (const name of names) {
            const row = document.createElement("div");
            row.className = "snapshot-item";
            row.innerHTML = `<span>${escapeHtml(name)}</span>`;

            const restoreBtn = document.createElement("button");
            restoreBtn.className = "btn btn-small";
            restoreBtn.textContent = "Восстановить";
            restoreBtn.onclick = () => restore(name);

            row.appendChild(restoreBtn);
            listEl.appendChild(row);
        }
    }

    async function refresh() {
        listEl.innerHTML = '<p class="empty-msg">Загрузка...</p>';
        try {
            const output = await listSnapshots(currentVm.uuid);
            renderSnapshots(parseSnapshotList(output));
        } catch (e) {
            renderSnapshots([]);
        }
    }

    async function take() {
        const name = nameInput.value.trim();
        if (!name) return;
        onStatus && onStatus("Создание снапшота...");
        try {
            await takeSnapshot(currentVm.uuid, name);
            onStatus && onStatus("Снапшот создан");
            nameInput.value = "";
        } catch (e) {
            onStatus && onStatus("Ошибка: " + (e.message || e), true);
        }
        await refresh();
    }

    async function restore(name) {
        onStatus && onStatus("Восстановление снапшота...");
        try {
            await restoreSnapshot(currentVm.uuid, name);
            onStatus && onStatus("Снапшот восстановлен");
        } catch (e) {
            onStatus && onStatus("Ошибка: " + (e.message || e), true);
        }
        await refresh();
    }

    function open(vm, statusCallback) {
        currentVm = vm;
        onStatus = statusCallback;
        title.textContent = "Снапшоты: " + vm.name;
        nameInput.value = "";
        modal.classList.remove("hidden");
        refresh();
    }

    function close() {
        modal.classList.add("hidden");
        currentVm = null;
        onStatus = null;
    }

    takeBtn.onclick = take;
    closeBtn.onclick = close;

    return { open, close, restore };
})();
