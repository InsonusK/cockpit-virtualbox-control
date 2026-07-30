import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { parseMediumList, parseVmDetails } from "../src/client/parser.ts";

describe("parseMediumList with real VBoxManage list hdds output", () => {
    test("parses Capacity and Encryption fields", () => {
        const output = `
UUID:           0fe10dbc-ef6b-4800-b1d2-c889ae921167
Parent UUID:    base
State:          locked write
Type:           normal (base)
Location:       /mnt/nvme/VM/ik-microk8s-dev/ik-microk8s-dev.vdi
Storage format: VDI
Capacity:       76800 MBytes
Encryption:     disabled
`;
        const result = parseMediumList(output, "hdd");
        assert.equal(result.length, 1);
        assert.equal(result[0].UUID, "0fe10dbc-ef6b-4800-b1d2-c889ae921167");
        assert.equal(result[0].Location, "/mnt/nvme/VM/ik-microk8s-dev/ik-microk8s-dev.vdi");
        assert.equal(result[0].Capacity, "76800 MBytes");
        assert.equal(result[0].Encryption, "disabled");
        assert.equal(result[0].kind, "hdd");
    });

    test("parses multiple medium blocks", () => {
        const output = `
UUID:           u1
Location:       /d1.vdi
Capacity:       10240 MBytes
Encryption:     disabled

UUID:           u2
Location:       /d2.vdi
Capacity:       20480 MBytes
Encryption:     enabled
`;
        const result = parseMediumList(output, "hdd");
        assert.equal(result.length, 2);
        assert.equal(result[0].Capacity, "10240 MBytes");
        assert.equal(result[0].Encryption, "disabled");
        assert.equal(result[1].Capacity, "20480 MBytes");
        assert.equal(result[1].Encryption, "enabled");
    });

    test("returns undefined for missing Capacity or Encryption", () => {
        const output = `
UUID:           u1
Location:       /d1.vdi
`;
        const result = parseMediumList(output, "hdd");
        assert.equal(result.length, 1);
        assert.equal(result[0].Capacity, undefined);
        assert.equal(result[0].Encryption, undefined);
    });
});

describe("parseVmDetails with controller names containing spaces", () => {
    test("includes HDD media attached to 'SATA Controller'", () => {
        const info = `
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
`;
        const hdds = `
UUID:           0fe10dbc-ef6b-4800-b1d2-c889ae921167
Parent UUID:    base
State:          locked write
Type:           normal (base)
Location:       /mnt/nvme/VM/ik-microk8s-dev/ik-microk8s-dev.vdi
Storage format: VDI
Capacity:       76800 MBytes
Encryption:     disabled
`;
        const details = parseVmDetails(info, hdds, "", "");

        assert.equal(details.media.length, 1);
        assert.equal(details.media[0].type, "HDD");
        assert.equal(details.media[0].path, "/mnt/nvme/VM/ik-microk8s-dev/ik-microk8s-dev.vdi");
        assert.equal(details.media[0].size, "76800 MBytes");
    });
});
