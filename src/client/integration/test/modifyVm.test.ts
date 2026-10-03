import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { modifyVm } from "../modifyVm.ts";
import { createMockSpawn, cockpitGlobal } from "../../../../tests/helpers/cockpitMock.ts";

const UUID = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";

describe("integration/modifyVm", () => {
    beforeEach(() => {
        cockpitGlobal.cockpit = { spawn: createMockSpawn({}) };
    });

    afterEach(() => {
        delete cockpitGlobal.cockpit;
    });

    const baseOptions = {
        memory: 2048,
        cpus: 2,
        vrdeEnabled: true,
        vrdePort: "3390",
        autostart: true,
        usbFilters: [],
        sharedFolders: [],
    };

    test("applies general, vrde and autostart settings", async () => {
        await modifyVm(UUID, 0, [], baseOptions);
        const calls = cockpitGlobal.cockpit.spawn.calls.map((c: any) => c.args);

        assert.deepEqual(calls[0], [
            "VBoxManage", "modifyvm", UUID,
            "--memory", "2048",
            "--cpus", "2",
            "--autostart-enabled", "on",
        ]);
        assert.deepEqual(calls[1], [
            "VBoxManage", "modifyvm", UUID,
            "--vrde", "on",
            "--vrdeport", "3390",
        ]);
    });

    test("turns vrde off without a port when disabled", async () => {
        await modifyVm(UUID, 0, [], { ...baseOptions, vrdeEnabled: false, autostart: false });
        const calls = cockpitGlobal.cockpit.spawn.calls.map((c: any) => c.args);

        assert.deepEqual(calls[0], [
            "VBoxManage", "modifyvm", UUID,
            "--memory", "2048",
            "--cpus", "2",
            "--autostart-enabled", "off",
        ]);
        assert.deepEqual(calls[1], ["VBoxManage", "modifyvm", UUID, "--vrde", "off"]);
    });

    test("removes existing USB filters highest index first, then adds the new list", async () => {
        await modifyVm(UUID, 2, [], {
            ...baseOptions,
            usbFilters: [
                { name: "Flash drive", vendorId: "0781", productId: "5567", active: true },
                { name: "No ids", vendorId: "", productId: "", active: false },
            ],
        });
        const calls = cockpitGlobal.cockpit.spawn.calls.map((c: any) => c.args);

        assert.deepEqual(calls[2], ["VBoxManage", "usbfilter", "remove", "2", "--target", UUID]);
        assert.deepEqual(calls[3], ["VBoxManage", "usbfilter", "remove", "1", "--target", UUID]);
        assert.deepEqual(calls[4], [
            "VBoxManage", "usbfilter", "add", "1",
            "--target", UUID,
            "--name", "Flash drive",
            "--action", "hold",
            "--active", "yes",
            "--vendorid", "0781",
            "--productid", "5567",
        ]);
        assert.deepEqual(calls[5], [
            "VBoxManage", "usbfilter", "add", "2",
            "--target", UUID,
            "--name", "No ids",
            "--action", "hold",
            "--active", "no",
        ]);
    });

    test("removes existing shared folders by name, then adds the new list", async () => {
        await modifyVm(UUID, 0, ["old-folder"], {
            ...baseOptions,
            sharedFolders: [
                { name: "shared", hostPath: "/home/user/shared", readOnly: true, autoMount: true },
                { name: "plain", hostPath: "/home/user/plain", readOnly: false, autoMount: false },
            ],
        });
        const calls = cockpitGlobal.cockpit.spawn.calls.map((c: any) => c.args);

        assert.deepEqual(calls[2], ["VBoxManage", "sharedfolder", "remove", UUID, "--name", "old-folder"]);
        assert.deepEqual(calls[3], [
            "VBoxManage", "sharedfolder", "add", UUID,
            "--name", "shared",
            "--hostpath", "/home/user/shared",
            "--readonly",
            "--automount",
        ]);
        assert.deepEqual(calls[4], [
            "VBoxManage", "sharedfolder", "add", UUID,
            "--name", "plain",
            "--hostpath", "/home/user/plain",
        ]);
    });

    test("rejects invalid UUID", async () => {
        await assert.rejects(async () => modifyVm("bad", 0, [], baseOptions), /Invalid VM UUID/);
        assert.equal(cockpitGlobal.cockpit.spawn.calls.length, 0);
    });
});
