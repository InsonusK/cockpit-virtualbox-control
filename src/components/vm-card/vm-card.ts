import {
    getVmState,
    getVmDetails,
    controlVm,
    startVm,
} from "../../client/index.ts";
import { formatFlag, stateLabel, stateDotClass } from "../../tools/utils.ts";
import type { Vm, VmDetails } from "../../client/model/index.ts";
import type { AlpineStatic } from "../../vendor/alpine.min.js";

const unknown_state = "unknown";

interface AppHandle {
    setStatus(message: string, isError?: boolean): void;
}

export interface VmCardData {
    vm: Vm;
    app: AppHandle;
    state: string;
    expanded: boolean;
    details: VmDetails | null;
    loadingDetails: boolean;
    loadingState: boolean;
    processing: boolean;
    activeCommand: string;

    formatFlag: typeof formatFlag;
    stateLabel: typeof stateLabel;
    stateDotClass: typeof stateDotClass;

    init(): Promise<void>;
    loadState(): Promise<void>;
    toggleDetails(): Promise<void>;
    runControl(command: string): Promise<void>;
    runStart(type: string): Promise<void>;
    openSnapshots(): void;
    isRunning(): boolean;
    isPaused(): boolean;
    isOff(): boolean;
}

/** Registers the `vmCard` Alpine.js data component for a single VM card. */
export function registerVmCard(Alpine: AlpineStatic): void {
    Alpine.data("vmCard", (vm: Vm, app: AppHandle): VmCardData => ({
        vm,
        app,
        state: unknown_state,
        expanded: false,
        details: null,
        loadingDetails: false,
        loadingState: false,
        processing: false,
        activeCommand: "",

        formatFlag,

        /** Fetches and parses the VM state when the card is initialized. */
        async init() {
            await this.loadState();
        },

        /** Fetches and parses the VM state. */
        async loadState() {
            this.loadingState = true;
            try {
                this.state = await getVmState(vm.uuid);
            } catch (e: any) {
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
                this.details = await getVmDetails(vm.uuid);
            } catch (e: any) {
                app.setStatus("Ошибка: " + (e.message || e), true);
                this.details = null;
            } finally {
                this.loadingDetails = false;
            }
        },

        /** Sends a controlvm command for the selected VM and refreshes the list. */
        runControl(command: string) {
            this.processing = true;
            this.activeCommand = command;
            app.setStatus(`Выполняется: controlvm ${command}...`);
            return controlVm(this.vm.uuid, command)
                .then(() => {
                    app.setStatus(`Готово: ${this.vm.name}`);
                })
                .catch((e: any) => {
                    app.setStatus("Ошибка: " + (e.message || e), true);
                })
                .finally(() => {
                    this.processing = false;
                    this.activeCommand = "";
                    // Return the promise so runControl's caller can wait for the
                    // state refresh to finish, even though loadState yields no value.
                    return this.loadState();
                });
        },

        /** Starts the selected VM in headless or GUI mode and refreshes the list. */
        runStart(type: string) {
            this.processing = true;
            this.activeCommand = `start:${type}`;
            app.setStatus(`Выполняется: startvm --type ${type}...`);
            return startVm(this.vm.uuid, type)
                .then(() => {
                    app.setStatus(`Готово: ${this.vm.name}`);
                })
                .catch((e: any) => {
                    app.setStatus("Ошибка: " + (e.message || e), true);
                })
                .finally(() => {
                    this.processing = false;
                    this.activeCommand = "";
                    // Return the promise so runStart's caller can wait for the
                    // state refresh to finish, even though loadState yields no value.
                    return this.loadState();
                });
        },

        /** Opens the snapshot modal for the selected VM. */
        openSnapshots() {
            Alpine.store("snapshotModal").show(this.vm, app.setStatus.bind(app));
        },

        stateLabel,
        stateDotClass,
        isRunning() {
            return this.state === "running";
        },
        isPaused() {
            return this.state === "paused";
        },
        isOff() {
            return this.state === "poweroff" || this.state === "saved" || this.state === "aborted";
        },
    }));
}
