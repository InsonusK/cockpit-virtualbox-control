import { listVms } from "../../client/vboxClient.js";
import { parseVmList } from "../../client/parser.js";


/**
 * Registers the main `app` Alpine.js data component.
 *
 * @param {Object} Alpine — Alpine.js instance.
 */
export function registerApp(Alpine) {
    Alpine.data("app", () => ({
        vms: [],
        status: { message: "Загрузка...", isError: false },
        loading: false,

        /** Updates the current status message shown in the UI. */
        setStatus(message, isError = false) {
            this.status = { message: message || "", isError };
        },

        /** Loads the VM list. */
        async loadVms() {
            if (this.loading) return;
            this.loading = true;
            this.setStatus("Загрузка...");
            try {
                const listOutput = await listVms();
                this.vms = parseVmList(listOutput);
                this.setStatus("Обновлено: " + new Date().toLocaleTimeString());
            } catch (e) {
                this.setStatus("Ошибка: " + (e.message || e), true);
                this.vms = [];
            } finally {
                this.loading = false;
            }
        },

        /** Called by Alpine when the component is initialized. */
        init() {
            this.loadVms();
        },
    }));
}
