import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { registerApp } from "../src/components/app/app.ts";
import { registerVmCard } from "../src/components/vm-card/vm-card.ts";
import { registerSnapshotModal } from "../src/components/snapshot-modal/snapshot-modal.ts";

const UUID = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";

/** Untyped view of globalThis for stubbing the `cockpit` global in tests. */
const cockpitGlobal = globalThis as any;

/**
 * Minimal stand-in for Alpine.js that lets us inspect registered data
 * functions and stores without a real DOM. Returned as `any` — it's test-only
 * scaffolding, not something worth fighting Alpine's `this`-bound typing for.
 */
function createAlpine(): any {
    const dataFns: Record<string, (...args: any[]) => any> = {};
    const stores: Record<string, any> = {};
    return {
        data(name: string, fn: (...args: any[]) => any) {
            dataFns[name] = fn;
        },
        store(name: string, value?: any) {
            if (value !== undefined) {
                stores[name] = value;
                return stores[name];
            }
            return stores[name];
        },
        start() {},
        getData(name: string, ...args: any[]) {
            return dataFns[name](...args);
        },
        getStore(name: string) {
            return stores[name];
        },
    };
}

function createDeferred() {
    let resolve!: (value?: any) => void;
    let reject!: (reason?: any) => void;
    const promise = new Promise((res, rej) => {
        resolve = res;
        reject = rej;
    });
    return { promise, resolve, reject };
}

/** Creates a mock cockpit.spawn that records calls and returns canned responses. */
function createMockSpawn(responses: Record<string, string>) {
    const calls: { args: string[]; opts: any }[] = [];
    function spawn(args: string[], opts?: any) {
        calls.push({ args, opts });
        const key = args.slice(1).join(" ");
        return Promise.resolve(responses[key] ?? "");
    }
    spawn.calls = calls;
    return spawn;
}

describe("Alpine components with mocked cockpit", () => {
    let alpine: any;
    let app: any;
    let statusMessages: { message: string; isError: boolean }[];

    beforeEach(() => {
        alpine = createAlpine();
        registerApp(alpine);
        registerVmCard(alpine);
        registerSnapshotModal(alpine);

        statusMessages = [];
        app = {
            vms: [],
            cards: {} as Record<string, any>,
            async loadVms() {
                this.vms.push({ name: "refreshed" });
            },
            setStatus(message: string, isError = false) {
                statusMessages.push({ message, isError });
            },
            registerCard(uuid: string, card: any) {
                this.cards[uuid] = card;
            },
            unregisterCard(uuid: string) {
                delete this.cards[uuid];
            },
        };
    });

    afterEach(() => {
        delete cockpitGlobal.cockpit;
    });

    describe("app", () => {
        test("loadVms populates VM list with name and uuid", async () => {
            cockpitGlobal.cockpit = {
                spawn: createMockSpawn({
                    "list vms": `"Test VM" {${UUID}}\n`,
                }),
            };

            const instance = alpine.getData("app");
            await instance.loadVms();

            assert.equal(instance.vms.length, 1);
            assert.equal(instance.vms[0].name, "Test VM");
            assert.equal(instance.vms[0].uuid, UUID);
            assert.equal(instance.vms[0].state, undefined);
            assert.equal(instance.loading, false);
            assert.match(instance.status.message, /Обновлено:/);
            assert.equal(instance.status.isError, false);
        });

        test("loadVms does not fetch per-VM state", async () => {
            cockpitGlobal.cockpit = {
                spawn: createMockSpawn({
                    "list vms": `"Test VM" {${UUID}}\n`,
                }),
            };

            const instance = alpine.getData("app");
            await instance.loadVms();

            assert.equal(instance.vms.length, 1);
            assert.equal(
                cockpitGlobal.cockpit.spawn.calls.some((c: any) => c.args[1] === "showvminfo"),
                false,
            );
        });

        test("loadVms shows error on list failure", async () => {
            cockpitGlobal.cockpit = {
                spawn: () => Promise.reject(new Error("VBoxManage failed")),
            };

            const instance = alpine.getData("app");
            await instance.loadVms();

            assert.equal(instance.vms.length, 0);
            assert.equal(instance.loading, false);
            assert.equal(instance.status.isError, true);
            assert.match(instance.status.message, /VBoxManage failed/);
        });

        test("loadVms is skipped while already loading", async () => {
            cockpitGlobal.cockpit = {
                spawn: createMockSpawn({ "list vms": "" }),
            };

            const instance = alpine.getData("app");
            instance.loading = true;
            await instance.loadVms();

            assert.equal(cockpitGlobal.cockpit.spawn.calls.length, 0);
        });
    });

    describe("vmCard", () => {
        test("init loads and parses VM state", async () => {
            cockpitGlobal.cockpit = {
                spawn: createMockSpawn({
                    [`showvminfo ${UUID} --machinereadable`]: 'VMState="running"\n',
                }),
            };

            const vm = { name: "Test VM", uuid: UUID };
            const card = alpine.getData("vmCard", vm, app);
            await card.init();

            assert.equal(card.loadingState, false);
            assert.equal(card.state, "running");
        });

        test("init falls back to unknown on state load failure", async () => {
            cockpitGlobal.cockpit = {
                spawn: () => Promise.reject(new Error("locked")),
            };

            const vm = { name: "Test VM", uuid: UUID };
            const card = alpine.getData("vmCard", vm, app);
            await card.init();

            assert.equal(card.loadingState, false);
            assert.equal(card.state, "unknown");
        });

        test("toggleDetails loads and parses VM details", async () => {
            cockpitGlobal.cockpit = {
                spawn: createMockSpawn({
                    [`showvminfo ${UUID} --machinereadable`]: 'name="Test VM"\ncpus="2"\nmemory="4096"\n',
                    "list hdds": "",
                    "list dvds": "",
                    [`showvminfo ${UUID}`]: "Name: 'Test VM'\n",
                }),
            };

            const vm = { name: "Test VM", uuid: UUID };
            const card = alpine.getData("vmCard", vm, app);
            await card.toggleDetails();

            assert.equal(card.expanded, true);
            assert.equal(card.loadingDetails, false);
            assert.equal(card.details.general.cpu, "2");
            assert.equal(card.details.general.memory, "4096 МБ");
        });

        test("toggleDetails collapses when already expanded", async () => {
            const vm = { name: "Test VM", uuid: UUID };
            const card = alpine.getData("vmCard", vm, app);
            card.expanded = true;
            card.details = { general: {} };

            await card.toggleDetails();

            assert.equal(card.expanded, false);
            assert.equal(card.details, null);
        });

        test("runControl calls controlvm and refreshes VM list", async () => {
            let controlCalled = false;
            cockpitGlobal.cockpit = {
                spawn: (args: string[]) => {
                    if (args[1] === "controlvm") controlCalled = true;
                    return Promise.resolve("");
                },
            };

            const vm = { name: "Test VM", uuid: UUID };
            const card = alpine.getData("vmCard", vm, app);
            await card.runControl("pause");

            assert.equal(controlCalled, true);
            assert.equal(statusMessages[statusMessages.length - 1].message, "Готово: Test VM");
        });

        test("runStart calls startvm and refreshes VM list", async () => {
            let startCalled = false;
            cockpitGlobal.cockpit = {
                spawn: (args: string[]) => {
                    if (args[1] === "startvm") startCalled = true;
                    return Promise.resolve("");
                },
            };

            const vm = { name: "Test VM", uuid: UUID };
            const card = alpine.getData("vmCard", vm, app);
            await card.runStart("headless");

            assert.equal(startCalled, true);
            assert.equal(statusMessages[statusMessages.length - 1].message, "Готово: Test VM");
        });

        test("runControl reports errors via app.setStatus", async () => {
            cockpitGlobal.cockpit = {
                spawn: () => Promise.reject(new Error("VM is locked")),
            };

            const vm = { name: "Test VM", uuid: UUID };
            const card = alpine.getData("vmCard", vm, app);
            await card.runControl("pause");

            assert.equal(statusMessages.some((m) => m.isError && /VM is locked/.test(m.message)), true);
        });

        test("runControl disables UI and marks the command as active while in progress", async () => {
            const deferred = createDeferred();
            cockpitGlobal.cockpit = {
                spawn: (args: string[]) => {
                    if (args[1] === "controlvm") return deferred.promise;
                    return Promise.resolve('VMState="running"\n');
                },
            };

            const vm = { name: "Test VM", uuid: UUID };
            const card = alpine.getData("vmCard", vm, app);
            const run = card.runControl("pause");

            assert.equal(card.processing, true);
            assert.equal(card.activeCommand, "pause");

            deferred.resolve();
            await run;

            assert.equal(card.processing, false);
            assert.equal(card.activeCommand, "");
        });

        test("runStart disables UI and marks the start type as active while in progress", async () => {
            const deferred = createDeferred();
            cockpitGlobal.cockpit = {
                spawn: (args: string[]) => {
                    if (args[1] === "startvm") return deferred.promise;
                    return Promise.resolve('VMState="running"\n');
                },
            };

            const vm = { name: "Test VM", uuid: UUID };
            const card = alpine.getData("vmCard", vm, app);
            const run = card.runStart("headless");

            assert.equal(card.processing, true);
            assert.equal(card.activeCommand, "start:headless");

            deferred.resolve();
            await run;

            assert.equal(card.processing, false);
            assert.equal(card.activeCommand, "");
        });

        test("openSnapshots shows modal for the selected VM", async () => {
            cockpitGlobal.cockpit = {
                spawn: createMockSpawn({
                    [`snapshot ${UUID} list --machinereadable`]: 'SnapshotName="base"\nSnapshotName-1="after-update"\n',
                }),
            };

            const vm = { name: "Test VM", uuid: UUID };
            const card = alpine.getData("vmCard", vm, app);
            card.openSnapshots(vm);

            const modal = alpine.getStore("snapshotModal");
            assert.equal(modal.isOpen, true);
            assert.equal(modal.vm.name, "Test VM");
            await new Promise((r) => setTimeout(r, 0)); // let refresh() finish
            assert.deepEqual(modal.snapshots, ["base", "after-update"]);
        });

        test("openSnapshots closes the dropdown", async () => {
            cockpitGlobal.cockpit = { spawn: createMockSpawn({}) };

            const vm = { name: "Test VM", uuid: UUID };
            const card = alpine.getData("vmCard", vm, app);
            card.dropdownOpen = true;
            card.openSnapshots(vm);

            assert.equal(card.dropdownOpen, false);
        });

        test("toggleDropdown flips dropdownOpen", () => {
            const vm = { name: "Test VM", uuid: UUID };
            const card = alpine.getData("vmCard", vm, app);

            card.toggleDropdown();
            assert.equal(card.dropdownOpen, true);
            card.toggleDropdown();
            assert.equal(card.dropdownOpen, false);
        });

        test("closeDropdown sets dropdownOpen to false", () => {
            const vm = { name: "Test VM", uuid: UUID };
            const card = alpine.getData("vmCard", vm, app);
            card.dropdownOpen = true;

            card.closeDropdown();
            assert.equal(card.dropdownOpen, false);
        });

        test("runVrdeRestart toggles VRDE off then on and refreshes state", async () => {
            cockpitGlobal.cockpit = {
                spawn: createMockSpawn({
                    [`showvminfo ${UUID} --machinereadable`]: 'VMState="running"\n',
                }),
            };

            const vm = { name: "Test VM", uuid: UUID };
            const card = alpine.getData("vmCard", vm, app);
            card.dropdownOpen = true;
            await card.runVrdeRestart();

            const controlCalls = cockpitGlobal.cockpit.spawn.calls.filter((c: any) => c.args[1] === "controlvm");
            assert.deepEqual(controlCalls[0].args, ["VBoxManage", "controlvm", UUID, "vrde", "off"]);
            assert.deepEqual(controlCalls[1].args, ["VBoxManage", "controlvm", UUID, "vrde", "on"]);
            assert.equal(card.dropdownOpen, false);
            assert.equal(statusMessages[statusMessages.length - 1].message, "Готово: Test VM");
        });

        test("runVrdeRestart reports errors via app.setStatus", async () => {
            cockpitGlobal.cockpit = {
                spawn: () => Promise.reject(new Error("VM is locked")),
            };

            const vm = { name: "Test VM", uuid: UUID };
            const card = alpine.getData("vmCard", vm, app);
            await card.runVrdeRestart();

            assert.equal(statusMessages.some((m) => m.isError && /VM is locked/.test(m.message)), true);
        });

        test("runVrdeRestart disables UI and marks the command as active while in progress", async () => {
            const deferred = createDeferred();
            cockpitGlobal.cockpit = {
                spawn: (args: string[]) => {
                    if (args[1] === "controlvm") return deferred.promise;
                    return Promise.resolve('VMState="running"\n');
                },
            };

            const vm = { name: "Test VM", uuid: UUID };
            const card = alpine.getData("vmCard", vm, app);
            const run = card.runVrdeRestart();

            assert.equal(card.processing, true);
            assert.equal(card.activeCommand, "vrde-restart");

            deferred.resolve();
            await run;

            assert.equal(card.processing, false);
            assert.equal(card.activeCommand, "");
        });
    });

    describe("snapshotModal", () => {
        test("show loads snapshots and resets name", async () => {
            cockpitGlobal.cockpit = {
                spawn: createMockSpawn({
                    [`snapshot ${UUID} list --machinereadable`]: 'SnapshotName="base"\n',
                }),
            };

            const modal = alpine.getStore("snapshotModal");
            modal.newName = "old";
            modal.show({ name: "Test VM", uuid: UUID }, app.setStatus.bind(app));

            assert.equal(modal.isOpen, true);
            assert.equal(modal.title, "Снапшоты: Test VM");
            assert.equal(modal.newName, "");
            await new Promise((r) => setTimeout(r, 0));
            assert.deepEqual(modal.snapshots, ["base"]);
        });

        test("show handles empty snapshot list without error", async () => {
            cockpitGlobal.cockpit = {
                spawn: () => Promise.reject(""),
            };

            const modal = alpine.getStore("snapshotModal");
            modal.show({ name: "Test VM", uuid: UUID }, app.setStatus.bind(app));
            await new Promise((r) => setTimeout(r, 0));

            assert.deepEqual(modal.snapshots, []);
            assert.equal(modal.loading, false);
            assert.equal(
                statusMessages.some((m) => /Ошибка загрузки снапшотов/.test(m.message)),
                false,
            );
        });

        test("take creates snapshot and refreshes list", async () => {
            const calls: string[] = [];
            cockpitGlobal.cockpit = {
                spawn: (args: string[]) => {
                    calls.push(args.slice(1).join(" "));
                    return Promise.resolve("");
                },
            };

            const modal = alpine.getStore("snapshotModal");
            modal.vm = { name: "Test VM", uuid: UUID };
            modal.newName = "before-update";
            modal.onStatus = app.setStatus.bind(app);
            await modal.take();

            assert.equal(calls.includes(`snapshot ${UUID} take before-update`), true);
            assert.equal(modal.newName, "");
            assert.equal(statusMessages.some((m) => /Снапшот создан/.test(m.message)), true);
        });

        test("take ignores empty name", async () => {
            let called = false;
            cockpitGlobal.cockpit = {
                spawn: () => {
                    called = true;
                    return Promise.resolve("");
                },
            };

            const modal = alpine.getStore("snapshotModal");
            modal.vm = { name: "Test VM", uuid: UUID };
            modal.newName = "   ";
            await modal.take();

            assert.equal(called, false);
        });

        test("restore restores snapshot and refreshes list", async () => {
            const calls: string[] = [];
            cockpitGlobal.cockpit = {
                spawn: (args: string[]) => {
                    calls.push(args.slice(1).join(" "));
                    return Promise.resolve("");
                },
            };

            const modal = alpine.getStore("snapshotModal");
            modal.vm = { name: "Test VM", uuid: UUID };
            modal.onStatus = app.setStatus.bind(app);
            await modal.restore("base");

            assert.equal(calls.includes(`snapshot ${UUID} restore base`), true);
            assert.equal(statusMessages.some((m) => /восстановлен/.test(m.message)), true);
        });

        test("close resets modal state", async () => {
            cockpitGlobal.cockpit = {
                spawn: createMockSpawn({
                    [`snapshot ${UUID} list --machinereadable`]: 'SnapshotName="base"\n',
                }),
            };

            const modal = alpine.getStore("snapshotModal");
            modal.show({ name: "Test VM", uuid: UUID }, app.setStatus.bind(app));
            await new Promise((r) => setTimeout(r, 0));

            modal.close();

            assert.equal(modal.isOpen, false);
            assert.equal(modal.vm, null);
            assert.deepEqual(modal.snapshots, []);
            assert.equal(modal.newName, "");
            assert.equal(modal.onStatus, null);
        });
    });
});
