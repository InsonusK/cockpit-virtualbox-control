import { listVms } from "../../client/listVms.ts";
import type { Vm } from "../../client/model/index.ts";
import type { AlpineStatic } from "../../vendor/alpine.min.js";

interface VmCardHandle {
    refresh(): Promise<void>;
}

export interface AppData {
    vms: Vm[];
    status: { message: string; isError: boolean };
    loading: boolean;
    cards: Record<string, VmCardHandle>;
    setStatus(message: string, isError?: boolean): void;
    registerCard(uuid: string, card: VmCardHandle): void;
    unregisterCard(uuid: string): void;
    loadVms(): Promise<void>;
    openCreateVmModal(): void;
    init(): void;
}

/** Registers the main `app` Alpine.js data component. */
export function registerApp(Alpine: AlpineStatic): void {
    Alpine.data("app", (): AppData => ({
        vms: [],
        status: { message: "Загрузка...", isError: false },
        loading: false,
        cards: {},

        /** Updates the current status message shown in the UI. */
        setStatus(message: string, isError = false) {
            this.status = { message: message || "", isError };
        },

        /** Registers a vm-card instance so its state/details can be refreshed later. */
        registerCard(uuid: string, card: VmCardHandle) {
            this.cards[uuid] = card;
        },

        /** Unregisters a vm-card instance when its element is removed. */
        unregisterCard(uuid: string) {
            delete this.cards[uuid];
        },

        /** Loads the VM list, then refreshes state (and expanded details) of existing cards. */
        async loadVms() {
            if (this.loading) return;
            this.loading = true;
            this.setStatus("Загрузка...");
            try {
                this.vms = await listVms();
                this.setStatus("Обновлено: " + new Date().toLocaleTimeString());
                await Promise.all(
                    this.vms
                        .map((vm) => this.cards[vm.uuid])
                        .filter((card): card is VmCardHandle => !!card)
                        .map((card) => card.refresh())
                );
            } catch (e: any) {
                this.setStatus("Ошибка: " + (e.message || e), true);
                this.vms = [];
            } finally {
                this.loading = false;
            }
        },

        /** Opens the create VM modal, passing status and refresh callbacks. */
        openCreateVmModal() {
            Alpine.store("createVmModal").show(
                this.setStatus.bind(this),
                this.loadVms.bind(this),
            );
        },

        /** Called by Alpine when the component is initialized. */
        init() {
            this.loadVms();
        },
    }));
}
