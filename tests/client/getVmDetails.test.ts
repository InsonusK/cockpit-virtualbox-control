import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { getVmDetails } from "../../src/client/getVmDetails.ts";
import { createMockSpawn, cockpitGlobal } from "../helpers/cockpitMock.ts";

const UUID = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";

describe("client/getVmDetails", () => {
    afterEach(() => {
        delete cockpitGlobal.cockpit;
    });

    test("maps full VM details to application model", async () => {
        cockpitGlobal.cockpit = {
            spawn: createMockSpawn({
                [`showvminfo ${UUID} --machinereadable`]: `
name="Test VM"
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
`,
                "list hdds": `
UUID: disk-uuid
Location: /path/disk.vdi
Capacity: 20480 MBytes
Type: normal
`,
                "list dvds": "",
                [`showvminfo ${UUID}`]: "Name: 'share', Host path: '/host/share' (machine mapping), readonly, auto-mount",
            }),
        };

        const details = await getVmDetails(UUID);

        assert.equal(details.general.cpu, "2");
        assert.equal(details.general.memory, "4096 МБ");
        assert.equal(details.general.os, "Ubuntu_64");
        assert.equal(details.general.vrdePort, "3389");

        assert.equal(details.networks.length, 1);
        assert.equal(details.networks[0].slot, 1);
        assert.equal(details.networks[0].type, "NAT");
        assert.equal(details.networks[0].mac, "080027AABBCC");
        assert.equal(details.networks[0].enabled, true);
        assert.equal(details.networks[0].portForwarding.length, 2);
        assert.match(details.networks[0].portForwarding[0], /ssh: tcp \*:2222 → \*:22/);

        assert.equal(details.media.length, 1);
        assert.equal(details.media[0].type, "HDD");
        assert.equal(details.media[0].path, "/path/disk.vdi");
        assert.equal(details.media[0].size, "20480 MBytes");

        assert.equal(details.usb.length, 1);
        assert.equal(details.usb[0].label, "Webcam (Logitech HD Webcam) [046d:0825]");
        assert.equal(details.usb[0].active, true);

        assert.equal(details.sharedFolders.length, 1);
        assert.equal(details.sharedFolders[0].name, "share");
        assert.equal(details.sharedFolders[0].readOnly, true);
        assert.equal(details.sharedFolders[0].autoMount, true);
        assert.equal(details.sharedFolders[0].guestPath, "share");
    });

    test("falls back to machine-readable shared folders when human output is missing", async () => {
        cockpitGlobal.cockpit = {
            spawn: createMockSpawn({
                [`showvminfo ${UUID} --machinereadable`]: `
name="NoHuman VM"
cpus="1"
memory="1024"
SharedFolderNameMachineMapping1="fallback"
SharedFolderPathMachineMapping1="/host/fallback"
`,
                "list hdds": "",
                "list dvds": "",
                [`showvminfo ${UUID}`]: "",
            }),
        };

        const details = await getVmDetails(UUID);

        assert.equal(details.sharedFolders.length, 1);
        assert.equal(details.sharedFolders[0].name, "fallback");
        assert.equal(details.sharedFolders[0].hostPath, "/host/fallback");
        assert.equal(details.sharedFolders[0].readOnly, null);
        assert.equal(details.sharedFolders[0].autoMount, null);
    });

    test("identifies DVD ISO by extension", async () => {
        cockpitGlobal.cockpit = {
            spawn: createMockSpawn({
                [`showvminfo ${UUID} --machinereadable`]: `
IDE-0-0="/path/installer.iso"
IDE-ImageUUID-0-0="iso-uuid"
`,
                "list hdds": "",
                "list dvds": "",
                [`showvminfo ${UUID}`]: "",
            }),
        };

        const details = await getVmDetails(UUID);

        assert.equal(details.media.length, 1);
        assert.equal(details.media[0].type, "DVD/ISO");
    });

    test("includes HDD media attached to controller names with spaces", async () => {
        cockpitGlobal.cockpit = {
            spawn: createMockSpawn({
                [`showvminfo ${UUID} --machinereadable`]: `
name="ik-microk8s-dev"
cpus="4"
memory="4096"
ostype="Ubuntu_64"
vrde="on"
vrdeports="26394"
nic1="bridged"
macaddress1="080027D23C0A"
cableconnected1="on"
storagecontrollername0="SATA Controller"
storagecontrollertype0="IntelAhci"
storagecontrollerinstance0="0"
storagecontrollerportcount0="30"
storagecontrollerbootable0="on"
"SATA Controller-0-0"="/mnt/nvme/VM/ik-microk8s-dev/ik-microk8s-dev.vdi"
"SATA Controller-ImageUUID-0-0"="0fe10dbc-ef6b-4800-b1d2-c889ae921167"
storagecontrollername1="IDE Controller"
storagecontrollertype1="PIIX4"
storagecontrollerinstance1="0"
storagecontrollerportcount1="2"
storagecontrollerbootable1="on"
"IDE Controller-0-0"="none"
"IDE Controller-0-1"="none"
`,
                "list hdds": `
UUID:           0fe10dbc-ef6b-4800-b1d2-c889ae921167
Parent UUID:    base
State:          locked write
Type:           normal (base)
Location:       /mnt/nvme/VM/ik-microk8s-dev/ik-microk8s-dev.vdi
Storage format: VDI
Capacity:       76800 MBytes
Encryption:     disabled
`,
                "list dvds": "",
                [`showvminfo ${UUID}`]: "",
            }),
        };

        const details = await getVmDetails(UUID);

        assert.equal(details.media.length, 1);
        assert.equal(details.media[0].type, "HDD");
        assert.equal(details.media[0].path, "/mnt/nvme/VM/ik-microk8s-dev/ik-microk8s-dev.vdi");
        assert.equal(details.media[0].size, "76800 MBytes");
    });
});
