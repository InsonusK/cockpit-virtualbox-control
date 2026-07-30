import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
    parseVmList,
    parseVmState,
    parseKeyValue,
    parseMediumList,
    parseSharedFolders,
    parseVmDetails,
} from "../src/client/parser.ts";

describe("parseVmList", () => {
    test("returns empty array for empty output", () => {
        assert.deepEqual(parseVmList(""), []);
    });

    test("parses single VM", () => {
        const output = '"Ubuntu" {a1b2c3d4-e5f6-7890-abcd-ef1234567890}';
        assert.deepEqual(parseVmList(output), [
            { name: "Ubuntu", uuid: "a1b2c3d4-e5f6-7890-abcd-ef1234567890" },
        ]);
    });

    test("parses multiple VMs", () => {
        const output = `
"Ubuntu" {a1b2c3d4-e5f6-7890-abcd-ef1234567890}
"Windows 10" {b2c3d4e5-f6a7-8901-bcde-f23456789012}
"CentOS" {c3d4e5f6-a7b8-9012-cdef-345678901234}
`;
        const result = parseVmList(output);
        assert.equal(result.length, 3);
        assert.equal(result[0].name, "Ubuntu");
        assert.equal(result[1].name, "Windows 10");
        assert.equal(result[2].name, "CentOS");
    });

    test("handles escaped quotes in VM name", () => {
        const output = '"VM with \\"quotes\\"" {a1b2c3d4-e5f6-7890-abcd-ef1234567890}';
        const result = parseVmList(output);
        assert.equal(result[0].name, 'VM with "quotes"');
    });
});

describe("parseVmState", () => {
    test("parses running state", () => {
        assert.equal(parseVmState('VMState="running"'), "running");
    });

    test("parses powered off state", () => {
        assert.equal(parseVmState('VMState="poweroff"'), "poweroff");
    });

    test("returns unknown when field is missing", () => {
        assert.equal(parseVmState("name=\"foo\""), "unknown");
    });

    test("returns unknown for empty output", () => {
        assert.equal(parseVmState(""), "unknown");
    });
});

describe("parseKeyValue", () => {
    test("parses simple pairs", () => {
        const map = parseKeyValue('name="value"\nfoo=bar');
        assert.equal(map.name, "value");
        assert.equal(map.foo, "bar");
    });

    test("strips surrounding quotes", () => {
        const map = parseKeyValue('key="quoted value"');
        assert.equal(map.key, "quoted value");
    });

    test("handles unquoted values", () => {
        const map = parseKeyValue('cpus=2\nmemory=4096');
        assert.equal(map.cpus, "2");
        assert.equal(map.memory, "4096");
    });

    test("returns empty object for empty output", () => {
        assert.deepEqual(parseKeyValue(""), {});
    });
});

describe("parseMediumList", () => {
    test("returns empty array for empty output", () => {
        assert.deepEqual(parseMediumList("", "hdd"), []);
    });

    test("returns empty array for undefined output", () => {
        assert.deepEqual(parseMediumList(undefined, "hdd"), []);
    });

    test("parses single medium block", () => {
        const output = `
UUID:        a1b2c3d4-e5f6-7890-abcd-ef1234567890
Parent UUID: base
State:       created
Type:        normal
Location:    /path/to/disk.vdi
Capacity:    20480 MBytes
`;
        const result = parseMediumList(output, "hdd");
        assert.equal(result.length, 1);
        assert.equal(result[0].UUID, "a1b2c3d4-e5f6-7890-abcd-ef1234567890");
        assert.equal(result[0].Location, "/path/to/disk.vdi");
        assert.equal(result[0].kind, "hdd");
    });

    test("parses multiple medium blocks", () => {
        const output = `
UUID:        u1
Location:    /d1.vdi

UUID:        u2
Location:    /d2.iso
`;
        const result = parseMediumList(output, "hdd");
        assert.equal(result.length, 2);
        assert.equal(result[0].UUID, "u1");
        assert.equal(result[1].UUID, "u2");
    });
});

describe("parseSharedFolders", () => {
    test("returns empty array for empty output", () => {
        assert.deepEqual(parseSharedFolders(""), []);
    });

    test("parses shared folder with flags", () => {
        const output = "Name: 'share', Host path: '/host/share' (machine mapping), readonly, auto-mount";
        const result = parseSharedFolders(output);
        assert.equal(result.length, 1);
        assert.equal(result[0].name, "share");
        assert.equal(result[0].hostPath, "/host/share");
        assert.equal(result[0].readOnly, true);
        assert.equal(result[0].autoMount, true);
        assert.equal(result[0].guestPath, "share");
    });

    test("parses shared folder without auto-mount", () => {
        const output = "Name: 'code', Host path: '/home/user/code' (machine mapping), readonly";
        const result = parseSharedFolders(output);
        assert.equal(result.length, 1);
        assert.equal(result[0].readOnly, true);
        assert.equal(result[0].autoMount, false);
        assert.equal(result[0].guestPath, "—");
    });
});

describe("parseVmDetails", () => {
    test("parses full VM details fixture", () => {
        const info = `
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
`;
        const hdds = `
UUID: disk-uuid
Location: /path/disk.vdi
Capacity: 20480 MBytes
Type: normal
`;
        const dvds = "";
        const human = "Name: 'share', Host path: '/host/share' (machine mapping), readonly, auto-mount";

        const details = parseVmDetails(info, hdds, dvds, human);

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
    });

    test("falls back to machine-readable shared folders when human output is missing", () => {
        const info = `
name="NoHuman VM"
cpus="1"
memory="1024"
SharedFolderNameMachineMapping1="fallback"
SharedFolderPathMachineMapping1="/host/fallback"
`;
        const details = parseVmDetails(info, "", "", "");
        assert.equal(details.sharedFolders.length, 1);
        assert.equal(details.sharedFolders[0].name, "fallback");
        assert.equal(details.sharedFolders[0].hostPath, "/host/fallback");
        assert.equal(details.sharedFolders[0].readOnly, null);
        assert.equal(details.sharedFolders[0].autoMount, null);
    });

    test("identifies DVD ISO by extension", () => {
        const info = `
IDE-0-0="/path/installer.iso"
IDE-ImageUUID-0-0="iso-uuid"
`;
        const details = parseVmDetails(info, "", "", "");
        assert.equal(details.media.length, 1);
        assert.equal(details.media[0].type, "DVD/ISO");
    });
});
