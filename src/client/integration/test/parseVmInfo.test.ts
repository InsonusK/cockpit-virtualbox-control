import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { parseVmInfo } from "../getVmInfo.ts";

describe("integration/parseVmInfo", () => {
    test("parses full VM info output", () => {
        const output = `
name="Test VM"
VMState="running"
cpus="2"
memory="4096"
ostype="Ubuntu_64"
vrde="on"
vrdeports="3389"
nic1="nat"
macaddress1="080027AABBCC"
cableconnected1="on"
Forwarding(0)="ssh,tcp,,2222,,22"
Forwarding(1)="http,tcp,,8080,,80"
SATA-0-0="/path/disk.vdi"
SATA-ImageUUID-0-0="disk-uuid"
USBFilterActive1="on"
USBFilterName1="Webcam"
USBFilterVendorId1="046d"
USBFilterProductId1="0825"
USBFilterManufacturer1="Logitech"
USBFilterProduct1="HD Webcam"
SharedFolderNameMachineMapping1="share"
SharedFolderPathMachineMapping1="/host/share"
`;

        const info = parseVmInfo(output);

        assert.equal(info.name, "Test VM");
        assert.equal(info.vmState, "running");
        assert.equal(info.cpus, "2");
        assert.equal(info.memory, "4096");
        assert.equal(info.ostype, "Ubuntu_64");
        assert.equal(info.vrde, "on");
        assert.equal(info.vrdePorts, "3389");

        assert.equal(info.nics.length, 1);
        assert.equal(info.nics[0].slot, 1);
        assert.equal(info.nics[0].type, "nat");
        assert.equal(info.nics[0].portForwarding.length, 2);

        assert.equal(info.storageAttachments.length, 1);
        assert.equal(info.storageAttachments[0].controllerName, "SATA");
        assert.equal(info.storageAttachments[0].path, "/path/disk.vdi");
        assert.equal(info.storageAttachments[0].imageUuid, "disk-uuid");

        assert.equal(info.usbFilters.length, 1);
        assert.equal(info.usbFilters[0].name, "Webcam");

        assert.equal(info.sharedFolderMappings.length, 1);
        assert.equal(info.sharedFolderMappings[0].name, "share");
    });
});
