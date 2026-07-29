import Alpine from "./vendor/alpine.min.js";
import { loadPartial } from "./components/loadPartial.js";
import { registerApp } from "./components/app.js";
import { registerVmCard } from "./components/vmCard.js";
import { registerSnapshotModal } from "./components/snapshotModal.js";

Alpine.directive("partial", (el, { expression }, { cleanup }) => {
    if (el.dataset.partialLoaded) return;
    el.dataset.partialLoaded = "true";

    const template = document.getElementById(expression);
    if (!template) {
        console.error(`Template not found: ${expression}`);
        return;
    }
    el.removeAttribute("x-partial");
    el.innerHTML = template.innerHTML;
    Alpine.initTree(el);

    cleanup(() => {
        el.innerHTML = "";
    });
});

registerApp(Alpine);
registerVmCard(Alpine);
registerSnapshotModal(Alpine);

async function init() {
    await Promise.all([
        loadPartial("partials/app.html", "#app"),
        loadPartial("partials/vm-card.html", "#tpl-vm-card"),
        loadPartial("partials/vm-details.html", "#tpl-vm-details"),
        loadPartial("partials/snapshot-modal.html", "#modal-container"),
    ]);
    Alpine.start();
}

init().catch((e) => {
    console.error("Failed to initialize app:", e);
    const p = document.createElement("p");
    p.className = "empty-msg";
    p.textContent = "Ошибка инициализации: " + (e.message || e);
    document.body.replaceChildren(p);
});
