import {
    vmInfo,
    vmInfoHuman,
    listHdds,
    listDvds,
    controlVm,
    startVm,
} from "../../client/vboxClient.js";
import { parseVmDetails, parseVmState } from "../../client/parser.js";
import { formatFlag } from "../../tools/utils.js";
import { stateLabel, stateDotClass } from "../../tools/utils.js";

const unknown_state = "unknown";
/**
 * Registers the `vmCard` Alpine.js data component for a single VM card.
 *
 * @param {Object} Alpine — Alpine.js instance.
 */
export function registerVmCard(Alpine) {
    Alpine.data("vmCard", (vm, app) => ({
        vm,
        app,
        state: unknown_state,
        expanded: false,
        details: null,
        loadingDetails: false,
        loadingState: false,

        formatFlag,

        /** Fetches and parses the VM state when the card is initialized. */
        async init() {
            await this.loadState();
        },

        /** Fetches and parses the VM state. */
        async loadState() {
            this.loadingState = true;
            try {
                const info = await vmInfo(vm.uuid);
                this.state = parseVmState(info);
            } catch (e) {
                this.state = unknown_state;
                console.warn("loadState failed for", vm.uuid, e.message || e);
            } finally {
                this.loadingState = false;
            }
        },

        /** Toggles the expanded details panel and loads VM details on first open. */
        async toggleDetails() {
            if (this.expanded) {
                this.expanded = false;
                this.details = null;
                return;
            }

            this.expanded = true;
            this.loadingDetails = true;
            try {
                const [info, hdds, dvds] = await Promise.all([
                    vmInfo(vm.uuid),
                    listHdds(),
                    listDvds(),
                ]);

                let humanInfo = "";
                try {
                    humanInfo = await vmInfoHuman(vm.uuid);
                } catch (e) {
                    console.warn("vmInfoHuman failed for", vm.uuid, e.message || e);
                }

                this.details = parseVmDetails(info, hdds, dvds, humanInfo);
            } catch (e) {
                app.setStatus("Ошибка: " + (e.message || e), true);
                this.details = null;
            } finally {
                this.loadingDetails = false;
            }
        },

        /** Sends a controlvm command for the selected VM and refreshes the list. */
        async runControl(command) {
            app.setStatus(`Выполняется: controlvm ${command}...`);
            try {
                await controlVm(this.vm.uuid, command);
                app.setStatus(`Готово: ${this.vm.name}`);
            } catch (e) {
                app.setStatus("Ошибка: " + (e.message || e), true);
            }
            await this.loadState();
        },

        /** Starts the selected VM in headless or GUI mode and refreshes the list. */
        async runStart(type) {
            app.setStatus(`Выполняется: startvm --type ${type}...`);
            try {
                await startVm(this.vm.uuid, type);
                app.setStatus(`Готово: ${this.vm.name}`);
            } catch (e) {
                app.setStatus("Ошибка: " + (e.message || e), true);
            }
            await this.loadState();
        },

        /** Opens the snapshot modal for the selected VM. */
        openSnapshots() {
            Alpine.store("snapshotModal").show(this.vm, app.setStatus.bind(app));
        },

        stateLabel,
        stateDotClass,
        isRunning(){
            return this.state === 'running'
        },
        isPaused(){
            return this.state === 'paused'
        },
        isOff(){
            return this.state === 'poweroff' || this.state === 'saved' || this.state === 'aborted'
        }
    }));
}
