import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { createVm } from "../createVm.ts";
import { createMockSpawn, cockpitGlobal } from "../../../../tests/helpers/cockpitMock.ts";

describe("integration/createVm", () => {
    const baseOptions = {
        name: "my_new_vm",
        folder: "/path/to/disk",
        isoPath: "/path/to/iso/install.iso",
        macAddress: "0800275C4F1A",
        vrdePort: "3390",
        memory: 4096,
        cpus: 4,
        diskSizeGb: 75,
        ostype: "Ubuntu_64",
        networkType: "bridged" as const,
        bridgeAdapter: "eno1",
        cpuExecutionCap: 100,
        portForwardings: [],
    };

    beforeEach(() => {
        cockpitGlobal.cockpit = { spawn: createMockSpawn({}) };
    });

    afterEach(() => {
        delete cockpitGlobal.cockpit;
    });

    test("runs the full VM creation sequence", async () => {
        await createVm(baseOptions);
        const calls = cockpitGlobal.cockpit.spawn.calls.map((c: any) => c.args);

        assert.deepEqual(calls[0], [
            "VBoxManage", "createvm",
            "--name", "my_new_vm",
            "--ostype", "Ubuntu_64",
            "--basefolder", "/path/to/disk",
            "--register",
        ]);
        assert.deepEqual(calls[1], [
            "VBoxManage", "modifyvm", "my_new_vm",
            "--memory", "4096",
            "--cpus", "4",
            "--ioapic", "on",
            "--cpuexecutioncap", "100",
        ]);
        assert.deepEqual(calls[2], [
            "VBoxManage", "createmedium", "disk",
            "--filename", "/path/to/disk/my_new_vm/my_new_vm.vdi",
            "--size", "76800",
            "--format", "VDI",
        ]);
        assert.deepEqual(calls[3], [
            "VBoxManage", "storagectl", "my_new_vm",
            "--name", "SATA Controller",
            "--add", "sata",
            "--controller", "IntelAhci",
        ]);
        assert.deepEqual(calls[4], [
            "VBoxManage", "storageattach", "my_new_vm",
            "--storagectl", "SATA Controller",
            "--port", "0",
            "--device", "0",
            "--type", "hdd",
            "--medium", "/path/to/disk/my_new_vm/my_new_vm.vdi",
        ]);
        assert.deepEqual(calls[5], [
            "VBoxManage", "storagectl", "my_new_vm",
            "--name", "IDE Controller",
            "--add", "ide",
        ]);
        assert.deepEqual(calls[6], [
            "VBoxManage", "storageattach", "my_new_vm",
            "--storagectl", "IDE Controller",
            "--port", "0",
            "--device", "0",
            "--type", "dvddrive",
            "--medium", "/path/to/iso/install.iso",
        ]);
        assert.deepEqual(calls[7], [
            "VBoxManage", "modifyvm", "my_new_vm",
            "--nic1", "bridged",
            "--bridgeadapter1", "eno1",
            "--macaddress1", "0800275C4F1A",
        ]);
        assert.deepEqual(calls[8], [
            "VBoxManage", "modifyvm", "my_new_vm",
            "--vrde", "on",
            "--vrdeport", "3390",
        ]);
    });

    test("passes the MAC address as provided", async () => {
        await createVm({ ...baseOptions, macAddress: "0800275c4f1a" });
        const calls = cockpitGlobal.cockpit.spawn.calls;
        const nicCall = calls.find((c: any) => c.args.includes("--nic1"));
        assert.equal(nicCall!.args.includes("0800275c4f1a"), true);
    });
});
