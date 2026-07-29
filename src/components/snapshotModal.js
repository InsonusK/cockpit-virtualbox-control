import { listSnapshots, takeSnapshot, restoreSnapshot } from "../client/vboxClient.js";

/**
 * Registers the `snapshotModal` Alpine.js store.
 *
 * @param {Object} Alpine — Alpine.js instance.
 */
export function registerSnapshotModal(Alpine) {
    Alpine.store("snapshotModal", {
        isOpen: false,
        vm: null,
        snapshots: [],
        newName: "",
        loading: false,
        onStatus: null,
        title: "Снапшоты",

        /** Extracts snapshot names from machinereadable `VBoxManage snapshot list` output. */
        parseSnapshotList(output) {
            const names = [];
            const re = /^SnapshotName(-\d+)?="(.*)"$/gm;
            let match;
            while ((match = re.exec(output)) !== null) {
                names.push(match[2]);
            }
            return names;
        },

        /** Reports a status message back to the parent app if a callback is set. */
        setStatus(message, isError = false) {
            if (this.onStatus) {
                this.onStatus(message, isError);
            }
        },

        /** Opens the modal for the given VM and loads its snapshots. */
        show(vm, statusCallback) {
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
                const output = await listSnapshots(this.vm.uuid);
                this.snapshots = this.parseSnapshotList(output);
            } catch (e) {
                this.snapshots = [];
                this.setStatus("Ошибка загрузки снапшотов: " + (e.message || e), true);
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
            } catch (e) {
                this.setStatus("Ошибка: " + (e.message || e), true);
            }
            await this.refresh();
        },

        /** Restores the VM to the selected snapshot. */
        async restore(name) {
            if (!this.vm) return;
            this.setStatus("Восстановление снапшота...");
            try {
                await restoreSnapshot(this.vm.uuid, name);
                this.setStatus("Снапшот восстановлен");
            } catch (e) {
                this.setStatus("Ошибка: " + (e.message || e), true);
            }
            await this.refresh();
        },
    });
}
