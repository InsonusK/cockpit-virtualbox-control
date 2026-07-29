import { listSnapshots, takeSnapshot, restoreSnapshot } from "../client/vboxClient.js";

export function registerSnapshotModal(Alpine) {
    Alpine.store("snapshotModal", {
        open: false,
        vm: null,
        snapshots: [],
        newName: "",
        loading: false,
        onStatus: null,
        title: "Снапшоты",

        parseSnapshotList(output) {
            const names = [];
            const re = /^SnapshotName(-\d+)?="(.*)"$/gm;
            let match;
            while ((match = re.exec(output)) !== null) {
                names.push(match[2]);
            }
            return names;
        },

        setStatus(message, isError = false) {
            if (this.onStatus) {
                this.onStatus(message, isError);
            }
        },

        open(vm, statusCallback) {
            this.vm = vm;
            this.onStatus = statusCallback;
            this.title = "Снапшоты: " + vm.name;
            this.newName = "";
            this.open = true;
            this.refresh();
        },

        close() {
            this.open = false;
            this.vm = null;
            this.snapshots = [];
            this.newName = "";
            this.onStatus = null;
        },

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
