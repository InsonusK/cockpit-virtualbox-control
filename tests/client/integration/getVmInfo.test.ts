import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { getVmInfo } from "../../../src/client/integration/getVmInfo.ts";
import { createMockSpawn, cockpitGlobal } from "../../helpers/cockpitMock.ts";

const UUID = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";

describe("integration/getVmInfo", () => {
    afterEach(() => {
        delete cockpitGlobal.cockpit;
    });

    test("calls showvminfo with --machinereadable", async () => {
        cockpitGlobal.cockpit = {
            spawn: createMockSpawn({
                [`showvminfo ${UUID} --machinereadable`]: 'VMState="running"\n',
            }),
        };
        await getVmInfo(UUID);
        const call = cockpitGlobal.cockpit.spawn.calls[0];
        assert.deepEqual(call.args, ["VBoxManage", "showvminfo", UUID, "--machinereadable"]);
    });

    test("rejects invalid UUID", async () => {
        cockpitGlobal.cockpit = { spawn: createMockSpawn({}) };
        await assert.rejects(async () => getVmInfo("not-a-uuid"), /Invalid VM UUID/);
        assert.equal(cockpitGlobal.cockpit.spawn.calls.length, 0);
    });

    test("parses VM state", async () => {
        cockpitGlobal.cockpit = {
            spawn: createMockSpawn({
                [`showvminfo ${UUID} --machinereadable`]: 'VMState="poweroff"\n',
            }),
        };
        const info = await getVmInfo(UUID);
        assert.equal(info.vmState, "poweroff");
    });

    test("returns unknown state when field is missing", async () => {
        cockpitGlobal.cockpit = {
            spawn: createMockSpawn({
                [`showvminfo ${UUID} --machinereadable`]: 'name="Test"\n',
            }),
        };
        const info = await getVmInfo(UUID);
        assert.equal(info.vmState, "unknown");
    });

    test("parses general info", async () => {
        cockpitGlobal.cockpit = {
            spawn: createMockSpawn({
                [`showvminfo ${UUID} --machinereadable`]: `
name="Test VM"
cpus="2"
memory="4096"
ostype="Ubuntu_64"
vrde="on"
vrdeports="3389"
`,
            }),
        };
        const info = await getVmInfo(UUID);
        assert.equal(info.name, "Test VM");
        assert.equal(info.cpus, "2");
        assert.equal(info.memory, "4096");
        assert.equal(info.ostype, "Ubuntu_64");
        assert.equal(info.vrde, "on");
        assert.equal(info.vrdePorts, "3389");
    });

    test("parses network adapters", async () => {
        cockpitGlobal.cockpit = {
            spawn: createMockSpawn({
                [`showvminfo ${UUID} --machinereadable`]: `
nic1="nat"
macaddress1="080027AABBCC"
cableconnected1="on"
Forwarding(0)="ssh,tcp,,2222,,22"
Forwarding(1)="http,tcp,,8080,,80"
nic2="bridged"
macaddress2="080027AABBDD"
cableconnected2="off"
`,
            }),
        };
        const info = await getVmInfo(UUID);
        assert.equal(info.nics.length, 2);
        assert.equal(info.nics[0].slot, 1);
        assert.equal(info.nics[0].type, "nat");
        assert.equal(info.nics[0].macAddress, "080027AABBCC");
        assert.equal(info.nics[0].cableConnected, "on");
        assert.equal(info.nics[0].portForwarding.length, 2);
        assert.equal(info.nics[0].portForwarding[0].name, "ssh");
        assert.equal(info.nics[0].portForwarding[0].hostPort, "2222");
        assert.equal(info.nics[1].slot, 2);
        assert.equal(info.nics[1].type, "bridged");
    });

    test("parses storage attachments", async () => {
        cockpitGlobal.cockpit = {
            spawn: createMockSpawn({
                [`showvminfo ${UUID} --machinereadable`]: `
"SATA Controller-0-0"="/path/disk.vdi"
"SATA Controller-ImageUUID-0-0"="disk-uuid"
"IDE Controller-0-0"="none"
`,
            }),
        };
        const info = await getVmInfo(UUID);
        assert.equal(info.storageAttachments.length, 1);
        assert.equal(info.storageAttachments[0].controllerName, "SATA Controller");
        assert.equal(info.storageAttachments[0].port, 0);
        assert.equal(info.storageAttachments[0].device, 0);
        assert.equal(info.storageAttachments[0].path, "/path/disk.vdi");
        assert.equal(info.storageAttachments[0].imageUuid, "disk-uuid");
    });

    test("parses USB filters", async () => {
        cockpitGlobal.cockpit = {
            spawn: createMockSpawn({
                [`showvminfo ${UUID} --machinereadable`]: `
USBFilterActive1="on"
USBFilterName1="Webcam"
USBFilterVendorId1="046d"
USBFilterProductId1="0825"
USBFilterManufacturer1="Logitech"
USBFilterProduct1="HD Webcam"
`,
            }),
        };
        const info = await getVmInfo(UUID);
        assert.equal(info.usbFilters.length, 1);
        assert.equal(info.usbFilters[0].index, 1);
        assert.equal(info.usbFilters[0].name, "Webcam");
        assert.equal(info.usbFilters[0].vendorId, "046d");
        assert.equal(info.usbFilters[0].productId, "0825");
        assert.equal(info.usbFilters[0].manufacturer, "Logitech");
        assert.equal(info.usbFilters[0].product, "HD Webcam");
        assert.equal(info.usbFilters[0].active, "on");
    });

    test("parses shared folder mappings", async () => {
        cockpitGlobal.cockpit = {
            spawn: createMockSpawn({
                [`showvminfo ${UUID} --machinereadable`]: `
SharedFolderNameMachineMapping1="share"
SharedFolderPathMachineMapping1="/host/share"
`,
            }),
        };
        const info = await getVmInfo(UUID);
        assert.equal(info.sharedFolderMappings.length, 1);
        assert.equal(info.sharedFolderMappings[0].index, 1);
        assert.equal(info.sharedFolderMappings[0].name, "share");
        assert.equal(info.sharedFolderMappings[0].hostPath, "/host/share");
    });
});
