import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import {
    listVms,
    listHdds,
    listDvds,
    vmInfo,
    vmInfoHuman,
    controlVm,
    startVm,
    listSnapshots,
    takeSnapshot,
    restoreSnapshot,
} from "../src/client/vboxClient.ts";

const UUID = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";

/** Untyped view of globalThis for stubbing the `cockpit` global in tests. */
const cockpitGlobal = globalThis as any;

/** Creates a mock cockpit.spawn that records every call and resolves with a response chosen from the provided map. */
function createMockSpawn(responses: Record<string, string> = {}) {
    const calls: { args: string[]; opts: any }[] = [];
    function spawn(args: string[], opts?: any) {
        calls.push({ args, opts });
        const key = args.slice(1).join(" ");
        const output = responses[key] ?? "";
        return Promise.resolve(output);
    }
    spawn.calls = calls;
    return spawn;
}

describe("vboxClient", () => {
    beforeEach(() => {
        cockpitGlobal.cockpit = {
            spawn: createMockSpawn({
                "list vms": `"Test VM" {${UUID}}\n`,
                "list hdds": "UUID: disk-uuid\nLocation: /path/disk.vdi\n",
                "list dvds": "",
                [`showvminfo ${UUID} --machinereadable`]: 'VMState="running"\ncpus="2"\n',
                [`showvminfo ${UUID}`]: "Name: 'Test VM'\n",
                [`snapshot ${UUID} list --machinereadable`]: 'SnapshotName="clean"\n',
            }),
        };
    });

    afterEach(() => {
        delete cockpitGlobal.cockpit;
    });

    describe("listVms", () => {
        test("calls VBoxManage list vms", async () => {
            await listVms();
            const call = cockpitGlobal.cockpit.spawn.calls[0];
            assert.deepEqual(call.args, ["VBoxManage", "list", "vms"]);
        });

        test("passes LC_ALL=C and err:message options", async () => {
            await listVms();
            const call = cockpitGlobal.cockpit.spawn.calls[0];
            assert.deepEqual(call.opts, { err: "message", environ: ["LC_ALL=C"] });
        });
    });

    describe("listHdds / listDvds", () => {
        test("calls VBoxManage list hdds", async () => {
            await listHdds();
            const call = cockpitGlobal.cockpit.spawn.calls[0];
            assert.deepEqual(call.args, ["VBoxManage", "list", "hdds"]);
        });

        test("calls VBoxManage list dvds", async () => {
            await listDvds();
            const call = cockpitGlobal.cockpit.spawn.calls[0];
            assert.deepEqual(call.args, ["VBoxManage", "list", "dvds"]);
        });
    });

    describe("vmInfo", () => {
        test("calls showvminfo with --machinereadable for valid UUID", async () => {
            await vmInfo(UUID);
            const call = cockpitGlobal.cockpit.spawn.calls[0];
            assert.deepEqual(call.args, ["VBoxManage", "showvminfo", UUID, "--machinereadable"]);
        });

        test("rejects invalid UUID", async () => {
            await assert.rejects(async () => vmInfo("not-a-uuid"), /Invalid VM UUID/);
            assert.equal(cockpitGlobal.cockpit.spawn.calls.length, 0);
        });
    });

    describe("vmInfoHuman", () => {
        test("calls showvminfo without --machinereadable", async () => {
            await vmInfoHuman(UUID);
            const call = cockpitGlobal.cockpit.spawn.calls[0];
            assert.deepEqual(call.args, ["VBoxManage", "showvminfo", UUID]);
        });

        test("rejects invalid UUID", async () => {
            await assert.rejects(async () => vmInfoHuman("not-a-uuid"), /Invalid VM UUID/);
        });
    });

    describe("controlVm", () => {
        test("calls controlvm pause", async () => {
            await controlVm(UUID, "pause");
            const call = cockpitGlobal.cockpit.spawn.calls[0];
            assert.deepEqual(call.args, ["VBoxManage", "controlvm", UUID, "pause"]);
        });

        test("rejects invalid control command", async () => {
            await assert.rejects(async () => controlVm(UUID, "reboot"), /Invalid VM control command/);
            assert.equal(cockpitGlobal.cockpit.spawn.calls.length, 0);
        });

        test("rejects invalid UUID", async () => {
            await assert.rejects(async () => controlVm("bad", "pause"), /Invalid VM UUID/);
        });
    });

    describe("startVm", () => {
        test("calls startvm --type headless", async () => {
            await startVm(UUID, "headless");
            const call = cockpitGlobal.cockpit.spawn.calls[0];
            assert.deepEqual(call.args, ["VBoxManage", "startvm", UUID, "--type", "headless"]);
        });

        test("calls startvm --type gui", async () => {
            await startVm(UUID, "gui");
            const call = cockpitGlobal.cockpit.spawn.calls[0];
            assert.deepEqual(call.args, ["VBoxManage", "startvm", UUID, "--type", "gui"]);
        });

        test("rejects invalid start type", async () => {
            await assert.rejects(async () => startVm(UUID, "sdl"), /Invalid VM start type/);
            assert.equal(cockpitGlobal.cockpit.spawn.calls.length, 0);
        });
    });

    describe("snapshot operations", () => {
        test("lists snapshots in machinereadable format", async () => {
            await listSnapshots(UUID);
            const call = cockpitGlobal.cockpit.spawn.calls[0];
            assert.deepEqual(call.args, ["VBoxManage", "snapshot", UUID, "list", "--machinereadable"]);
        });

        test("takes snapshot with trimmed name", async () => {
            await takeSnapshot(UUID, "  before-update  ");
            const call = cockpitGlobal.cockpit.spawn.calls[0];
            assert.deepEqual(call.args, ["VBoxManage", "snapshot", UUID, "take", "before-update"]);
        });

        test("rejects empty snapshot name", async () => {
            await assert.rejects(async () => takeSnapshot(UUID, "   "), /Snapshot name is empty/);
            assert.equal(cockpitGlobal.cockpit.spawn.calls.length, 0);
        });

        test("restores snapshot", async () => {
            await restoreSnapshot(UUID, "clean");
            const call = cockpitGlobal.cockpit.spawn.calls[0];
            assert.deepEqual(call.args, ["VBoxManage", "snapshot", UUID, "restore", "clean"]);
        });

        test("rejects empty snapshot name on restore", async () => {
            await assert.rejects(async () => restoreSnapshot(UUID, ""), /Snapshot name is empty/);
        });

        test("returns empty list when VBoxManage reports no snapshots", async () => {
            cockpitGlobal.cockpit = {
                spawn: createMockSpawn({
                    [`snapshot ${UUID} list --machinereadable`]: "This machine does not have any snapshots\n",
                }),
            };
            const output = await listSnapshots(UUID);
            assert.equal(output, "");
        });

        test("treats empty rejection as empty snapshot list", async () => {
            cockpitGlobal.cockpit = {
                spawn: () => Promise.reject(""),
            };
            const output = await listSnapshots(UUID);
            assert.equal(output, "");
        });

        test("propagates real snapshot errors", async () => {
            cockpitGlobal.cockpit = {
                spawn: () => Promise.reject(new Error("VM not found")),
            };
            await assert.rejects(() => listSnapshots(UUID), /VM not found/);
        });
    });

    describe("error handling", () => {
        test("propagates spawn rejection", async () => {
            cockpitGlobal.cockpit = {
                spawn: () => Promise.reject(new Error("VBoxManage not found")),
            };
            await assert.rejects(() => listVms(), /VBoxManage not found/);
        });

        test("throws when cockpit global is missing", async () => {
            delete cockpitGlobal.cockpit;
            await assert.rejects(async () => listVms(), /cockpit is not available/);
        });
    });
});
