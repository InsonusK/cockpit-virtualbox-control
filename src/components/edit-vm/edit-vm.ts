import { getVmEditableInfo, modifyVm } from "../../client/index.ts";
import type { ModifyVmOptions } from "../../client/index.ts";
import type { Vm } from "../../client/model/index.ts";
import type { AlpineStatic } from "../../vendor/alpine.min.js";

type StatusCallback = (message: string, isError?: boolean) => void;
type RefreshCallback = () => Promise<void>;

export interface UsbFilterForm {
    name: string;
    vendorId: string;
    productId: string;
    active: boolean;
}

export interface SharedFolderForm {
    name: string;
    hostPath: string;
    readOnly: boolean;
    autoMount: boolean;
}

export interface EditVmModalStore {
    isOpen: boolean;
    loading: boolean;
    loadingData: boolean;
    vm: Vm | null;
    onStatus: StatusCallback | null;
    onRefresh: RefreshCallback | null;

    memory: number;
    cpus: number;
    vrdeEnabled: boolean;
    vrdePort: string;
    autostart: boolean;
    usbFilters: UsbFilterForm[];
    sharedFolders: SharedFolderForm[];

    existingUsbFilterCount: number;
    existingSharedFolderNames: string[];

    show(vm: Vm, statusCallback: StatusCallback, refreshCallback: RefreshCallback): void;
    close(): void;
    setStatus(message: string, isError?: boolean): void;
    load(): Promise<void>;
    submit(): Promise<void>;
    addUsbFilter(): void;
    removeUsbFilter(index: number): void;
    addSharedFolder(): void;
    removeSharedFolder(index: number): void;
}

const PORT_RE = /^\d+$/;

/** Registers the `editVmModal` Alpine.js store. */
export function registerEditVmModal(Alpine: AlpineStatic): void {
    const store: EditVmModalStore = {
        isOpen: false,
        loading: false,
        loadingData: false,
        vm: null,
        onStatus: null,
        onRefresh: null,

        memory: 0,
        cpus: 0,
        vrdeEnabled: false,
        vrdePort: "3390",
        autostart: false,
        usbFilters: [],
        sharedFolders: [],

        existingUsbFilterCount: 0,
        existingSharedFolderNames: [],

        /** Opens the modal for the given VM and loads its current settings. */
        show(vm, statusCallback, refreshCallback) {
            this.vm = vm;
            this.onStatus = statusCallback;
            this.onRefresh = refreshCallback;
            this.isOpen = true;
            this.load();
        },

        /** Closes the modal and resets its state. */
        close() {
            this.isOpen = false;
            this.vm = null;
            this.onStatus = null;
            this.onRefresh = null;
            this.usbFilters = [];
            this.sharedFolders = [];
            this.existingUsbFilterCount = 0;
            this.existingSharedFolderNames = [];
        },

        /** Reports a status message back to the parent app if a callback is set. */
        setStatus(message, isError = false) {
            if (this.onStatus) {
                this.onStatus(message, isError);
            }
        },

        /** Loads the VM's current settings from VBoxManage and pre-fills the form. */
        async load() {
            if (!this.vm) return;
            this.loadingData = true;
            try {
                const info = await getVmEditableInfo(this.vm.uuid);
                this.memory = info.memory;
                this.cpus = info.cpus;
                this.vrdeEnabled = info.vrdeEnabled;
                this.vrdePort = info.vrdePort;
                this.autostart = info.autostart;
                this.usbFilters = info.usbFilters.map((f) => ({ ...f }));
                this.sharedFolders = info.sharedFolders.map((f) => ({ ...f }));
                this.existingUsbFilterCount = info.usbFilters.length;
                this.existingSharedFolderNames = info.sharedFolders.map((f) => f.name);
            } catch (e: any) {
                this.setStatus("Ошибка загрузки параметров VM: " + ((e && e.message) || e || "неизвестная ошибка"), true);
                this.isOpen = false;
            } finally {
                this.loadingData = false;
            }
        },

        /** Validates the form and applies the changes to the VM. */
        async submit() {
            if (this.loading || !this.vm) return;

            if (this.memory <= 0 || this.cpus <= 0) {
                this.setStatus("Память и CPU должны быть больше 0", true);
                return;
            }
            if (this.vrdeEnabled && !PORT_RE.test((this.vrdePort || "").trim())) {
                this.setStatus("Порт VRDE должен быть числом", true);
                return;
            }
            const usbFilters = this.usbFilters.filter((f) => f.name.trim());
            const sharedFolders = this.sharedFolders.filter((f) => f.name.trim() && f.hostPath.trim());

            const options: ModifyVmOptions = {
                memory: this.memory,
                cpus: this.cpus,
                vrdeEnabled: this.vrdeEnabled,
                vrdePort: (this.vrdePort || "").trim(),
                autostart: this.autostart,
                usbFilters,
                sharedFolders,
            };

            this.loading = true;
            this.setStatus(`Применение параметров ${this.vm.name}...`);
            try {
                await modifyVm(this.vm.uuid, this.existingUsbFilterCount, this.existingSharedFolderNames, options);
                this.setStatus(`Параметры ${this.vm.name} обновлены`);
                this.isOpen = false;
                if (this.onRefresh) {
                    await this.onRefresh();
                }
            } catch (e: any) {
                this.setStatus("Ошибка изменения VM: " + ((e && e.message) || e || "неизвестная ошибка"), true);
            } finally {
                this.loading = false;
            }
        },

        /** Adds a blank USB filter row. */
        addUsbFilter() {
            this.usbFilters.push({ name: "", vendorId: "", productId: "", active: true });
        },

        /** Removes the USB filter row at the given index. */
        removeUsbFilter(index) {
            this.usbFilters.splice(index, 1);
        },

        /** Adds a blank shared folder row. */
        addSharedFolder() {
            this.sharedFolders.push({ name: "", hostPath: "", readOnly: false, autoMount: true });
        },

        /** Removes the shared folder row at the given index. */
        removeSharedFolder(index) {
            this.sharedFolders.splice(index, 1);
        },
    };

    Alpine.store("editVmModal", store);
}
