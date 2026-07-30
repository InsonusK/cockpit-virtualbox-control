import { listVms } from "../../client/vboxClient.ts";
import { parseVmList } from "../../client/parser.ts";
import type { Vm } from "../../client/types.ts";
import type { AlpineStatic } from "../../vendor/alpine.min.js";

export interface AppData {
    vms: Vm[];
    status: { message: string; isError: boolean };
    loading: boolean;
    setStatus(message: string, isError?: boolean): void;
    loadVms(): Promise<void>;
    init(): void;
}

/** Registers the main `app` Alpine.js data component. */
export function registerApp(Alpine: AlpineStatic): void {
    Alpine.data("app", (): AppData => ({
        vms: [],
        status: { message: "Загрузка...", isError: false },
        loading: false,

        /** Updates the current status message shown in the UI. */
        setStatus(message: string, isError = false) {
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
            } catch (e: any) {
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
