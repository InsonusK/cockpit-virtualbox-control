import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { parseVmStorageAttachments } from "../getVmInfo.ts";

describe("integration/parseVmStorageAttachments", () => {
    test("returns empty array when no attachments", () => {
        assert.deepEqual(parseVmStorageAttachments({}), []);
    });

    test("parses simple HDD attachment", () => {
        const attachments = parseVmStorageAttachments({
            "SATA-0-0": "/path/disk.vdi",
            "SATA-ImageUUID-0-0": "disk-uuid",
        });

        assert.equal(attachments.length, 1);
        assert.equal(attachments[0].controllerName, "SATA");
        assert.equal(attachments[0].port, 0);
        assert.equal(attachments[0].device, 0);
        assert.equal(attachments[0].path, "/path/disk.vdi");
        assert.equal(attachments[0].imageUuid, "disk-uuid");
    });

    test("parses controller names with spaces", () => {
        const attachments = parseVmStorageAttachments({
            "SATA Controller-0-0": "/path/disk.vdi",
            "SATA Controller-ImageUUID-0-0": "disk-uuid",
        });

        assert.equal(attachments.length, 1);
        assert.equal(attachments[0].controllerName, "SATA Controller");
        assert.equal(attachments[0].port, 0);
        assert.equal(attachments[0].device, 0);
    });

    test("ignores none and attribute keys", () => {
        const attachments = parseVmStorageAttachments({
            "SATA Controller-0-0": "/path/disk.vdi",
            "SATA Controller-1-0": "none",
            "SATA Controller-nonrotational-0-0": "off",
            "SATA Controller-discard-0-0": "off",
            "SATA Controller-ImageUUID-0-0": "disk-uuid",
        });

        assert.equal(attachments.length, 1);
        assert.equal(attachments[0].path, "/path/disk.vdi");
    });

    test("parses empty IDE drives", () => {
        const attachments = parseVmStorageAttachments({
            "IDE Controller-0-0": "emptydrive",
            "IDE Controller-IsEjected-0-0": "on",
        });

        assert.equal(attachments.length, 1);
        assert.equal(attachments[0].controllerName, "IDE Controller");
        assert.equal(attachments[0].path, "emptydrive");
        assert.equal(attachments[0].imageUuid, null);
    });

    test("handles snapshot path with UUID in curly braces", () => {
        const attachments = parseVmStorageAttachments({
            "SATA Controller-0-0": "/mnt/nvme/VM/ik-microk8s-dev/Snapshots/{bf734afd-8fdb-4254-a48c-dec69b33457e}.vdi",
            "SATA Controller-ImageUUID-0-0": "bf734afd-8fdb-4254-a48c-dec69b33457e",
            "SATA Controller-1-0": "none",
            "IDE Controller-0-0": "emptydrive",
            "IDE Controller-IsEjected-0-0": "on",
        });

        assert.equal(attachments.length, 2);

        const hdd = attachments[0];
        assert.equal(hdd.controllerName, "SATA Controller");
        assert.equal(hdd.port, 0);
        assert.equal(hdd.device, 0);
        assert.equal(hdd.path, "/mnt/nvme/VM/ik-microk8s-dev/Snapshots/{bf734afd-8fdb-4254-a48c-dec69b33457e}.vdi");
        assert.equal(hdd.imageUuid, "bf734afd-8fdb-4254-a48c-dec69b33457e");

        const ide = attachments[1];
        assert.equal(ide.controllerName, "IDE Controller");
        assert.equal(ide.path, "emptydrive");
    });
});
