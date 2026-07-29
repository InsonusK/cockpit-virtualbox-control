"use strict";

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

function buildActionButtons(vm, callbacks) {
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
        addBtn("Пауза", "", () => callbacks.onControl(vm, "pause"));
        addBtn("Сохранить состояние", "", () => callbacks.onControl(vm, "savestate"));
        addBtn("ACPI выключение", "", () => callbacks.onControl(vm, "acpipowerbutton"));
        addBtn("Force off", "btn-danger", () => callbacks.onControl(vm, "poweroff"));
    } else if (vm.state === "paused") {
        addBtn("Продолжить", "", () => callbacks.onControl(vm, "resume"));
        addBtn("Force off", "btn-danger", () => callbacks.onControl(vm, "poweroff"));
    } else {
        addBtn("Запустить (headless)", "", () => callbacks.onStart(vm, "headless"));
        addBtn("Запустить (GUI)", "", () => callbacks.onStart(vm, "gui"));
    }

    addBtn("Снапшоты", "btn-secondary", () => callbacks.onSnapshots(vm));

    return frag;
}

function renderVmCard(vm, callbacks) {
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
    actions.appendChild(buildActionButtons(vm, callbacks));

    header.appendChild(info);
    header.appendChild(actions);

    const details = document.createElement("div");
    details.className = "vm-details";

    header.onclick = () => callbacks.onToggleDetails(vm, details, card);

    card.appendChild(header);
    card.appendChild(details);
    return card;
}
