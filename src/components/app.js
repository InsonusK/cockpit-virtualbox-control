import { listVms, vmInfo, controlVm, startVm } from "../client/vboxClient.js";
import { parseVmList, parseVmState } from "../client/parser.js";
import { stateLabel, stateDotClass } from "./utils.js";

export function registerApp(Alpine) {
    Alpine.data("app", () => ({
        vms: [],
        status: { message: "Загрузка...", isError: false },
        loading: false,

        setStatus(message, isError = false) {
            this.status = { message: message || "", isError };
        },

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

        openSnapshots(vm) {
            Alpine.store("snapshotModal").open(vm, this.setStatus.bind(this));
        },

        stateLabel,
        stateDotClass,

        init() {
            this.loadVms();
        },
    }));
}
