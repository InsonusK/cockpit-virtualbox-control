import { listVms, vmInfo, controlVm, startVm } from "../client/vboxClient.js";
import { parseVmList, parseVmState } from "../client/parser.js";
import { stateLabel, stateDotClass } from "./utils.js";

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

        /** Sends a controlvm command for the selected VM and refreshes the list. */
        async runControl(vm, command) {
            this.setStatus(`Выполняется: controlvm ${command}...`);
            try {
                await controlVm(vm.uuid, command);
                this.setStatus(`Готово: ${vm.name}`);
            } catch (e) {
                this.setStatus("Ошибка: " + (e.message || e), true);
            }
            await this.loadVms();
        },

        /** Starts the selected VM in headless or GUI mode and refreshes the list. */
        async runStart(vm, type) {
            this.setStatus(`Выполняется: startvm --type ${type}...`);
            try {
                await startVm(vm.uuid, type);
                this.setStatus(`Готово: ${vm.name}`);
            } catch (e) {
                this.setStatus("Ошибка: " + (e.message || e), true);
            }
            await this.loadVms();
        },

        /** Opens the snapshot modal for the selected VM. */
        openSnapshots(vm) {
            Alpine.store("snapshotModal").show(vm, this.setStatus.bind(this));
        },

        stateLabel,
        stateDotClass,

        /** Called by Alpine when the component is initialized. */
        init() {
            this.loadVms();
        },
    }));
}
