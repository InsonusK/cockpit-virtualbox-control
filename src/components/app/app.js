import { listVms, vmInfo, controlVm, startVm } from "../../client/vboxClient.js";
import { parseVmList, parseVmState } from "../../client/parser.js";


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

        /** Loads the VM list and refreshes each VM's state. */
        async loadVms() {
            if (this.loading) return;
            this.loading = true;
            this.setStatus("Загрузка...");
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

                this.vms = withState;
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
