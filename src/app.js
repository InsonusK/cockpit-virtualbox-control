import Alpine from "./vendor/alpine.min.js";
import { loadPartial } from "./components/loadPartial.js";
import { registerApp } from "./components/app.js";
import { registerVmCard } from "./components/vmCard.js";
import { registerSnapshotModal } from "./components/snapshotModal.js";

registerApp(Alpine);
registerVmCard(Alpine);
registerSnapshotModal(Alpine);

async function init() {
    await Promise.all([
        loadPartial("partials/app.html", "#app"),
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
