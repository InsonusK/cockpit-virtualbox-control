import { listSnapshots, takeSnapshot, restoreSnapshot } from "../../client/index.ts";
import type { Vm } from "../../client/model/index.ts";
import type { AlpineStatic } from "../../vendor/alpine.min.js";

type StatusCallback = (message: string, isError?: boolean) => void;

export interface SnapshotModalStore {
    isOpen: boolean;
    vm: Vm | null;
    snapshots: string[];
    newName: string;
    loading: boolean;
    onStatus: StatusCallback | null;
    title: string;

    setStatus(message: string, isError?: boolean): void;
    show(vm: Vm, statusCallback: StatusCallback): void;
    close(): void;
    refresh(): Promise<void>;
    take(): Promise<void>;
    restore(name: string): Promise<void>;
}

/** Registers the `snapshotModal` Alpine.js store. */
export function registerSnapshotModal(Alpine: AlpineStatic): void {
    const store: SnapshotModalStore = {
        isOpen: false,
        vm: null,
        snapshots: [],
        newName: "",
        loading: false,
        onStatus: null,
        title: "Снапшоты",

        /** Reports a status message back to the parent app if a callback is set. */
        setStatus(message: string, isError = false) {
            if (this.onStatus) {
                this.onStatus(message, isError);
            }
        },

        /** Opens the modal for the given VM and loads its snapshots. */
        show(vm: Vm, statusCallback: StatusCallback) {
            this.vm = vm;
            this.onStatus = statusCallback;
            this.title = "Снапшоты: " + vm.name;
            this.newName = "";
            this.isOpen = true;
            this.refresh();
        },

        /** Closes the modal and resets its state. */
        close() {
            this.isOpen = false;
            this.vm = null;
            this.snapshots = [];
            this.newName = "";
            this.onStatus = null;
        },

        /** Reloads the snapshot list for the current VM. */
        async refresh() {
            if (!this.vm) return;
            this.loading = true;
            this.snapshots = [];
            try {
                this.snapshots = await listSnapshots(this.vm.uuid);
            } catch (e: any) {
                this.snapshots = [];
                this.setStatus("Ошибка загрузки снапшотов: " + ((e && e.message) || e || "неизвестная ошибка"), true);
            } finally {
                this.loading = false;
            }
        },

        /** Creates a new snapshot from the name entered in the modal. */
        async take() {
            const name = (this.newName || "").trim();
            if (!name || !this.vm) return;
            this.setStatus("Создание снапшота...");
            try {
                await takeSnapshot(this.vm.uuid, name);
                this.setStatus("Снапшот создан");
                this.newName = "";
            } catch (e: any) {
                this.setStatus("Ошибка: " + (e.message || e), true);
            }
            await this.refresh();
        },

        /** Restores the VM to the selected snapshot. */
        async restore(name: string) {
            if (!this.vm) return;
            this.setStatus("Восстановление снапшота...");
            try {
                await restoreSnapshot(this.vm.uuid, name);
                this.setStatus("Снапшот восстановлен");
            } catch (e: any) {
                this.setStatus("Ошибка: " + (e.message || e), true);
            }
            await this.refresh();
        },
    };

    Alpine.store("snapshotModal", store);
}
