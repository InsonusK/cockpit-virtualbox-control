import Alpine from "./vendor/alpine.min.js";
import { loadPartial } from "./tools/loadPartial.ts";
import { registerApp } from "./components/app/app.ts";
import { registerVmCard } from "./components/vm-card/vm-card.ts";
import { registerSnapshotModal } from "./components/snapshot-modal/snapshot-modal.ts";
import { registerCreateVmModal } from "./components/create-vm/create-vm.ts";

registerApp(Alpine);
registerVmCard(Alpine);
registerSnapshotModal(Alpine);
registerCreateVmModal(Alpine);

/** Loads partial templates into the DOM and starts Alpine.js. */
async function init(): Promise<void> {
    await Promise.all([
        loadPartial("components/app/app.html", "#app"),
        loadPartial("components/snapshot-modal/snapshot-modal.html", "#modal-container"),
        loadPartial("components/create-vm/create-vm.html", "#modal-container"),
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
