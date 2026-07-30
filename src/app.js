import Alpine from "./vendor/alpine.min.js";
import { loadPartial } from "./tools/loadPartial.js";
import { registerApp } from "./components/app/app.js";
import { registerVmCard } from "./components/vm-card/vm-card.js";
import { registerSnapshotModal } from "./components/snapshot-modal/snapshot-modal.js";

registerApp(Alpine);
registerVmCard(Alpine);
registerSnapshotModal(Alpine);

/**
 * Loads partial templates into the DOM and starts Alpine.js.
 *
 * @returns {Promise<void>}
 */
async function init() {
    await Promise.all([
        loadPartial("components/app/app.html", "#app"),
        loadPartial("components/snapshot-modal/snapshot-modal.html", "#modal-container"),
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
