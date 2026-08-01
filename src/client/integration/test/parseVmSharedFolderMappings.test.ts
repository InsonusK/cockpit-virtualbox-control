import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { parseVmSharedFolderMappings } from "../getVmInfo.ts";

describe("integration/parseVmSharedFolderMappings", () => {
    test("returns empty array when no mappings", () => {
        assert.deepEqual(parseVmSharedFolderMappings({}), []);
    });

    test("parses single shared folder mapping", () => {
        const mappings = parseVmSharedFolderMappings({
            SharedFolderNameMachineMapping1: "share",
            SharedFolderPathMachineMapping1: "/host/share",
        });

        assert.equal(mappings.length, 1);
        assert.equal(mappings[0].index, 1);
        assert.equal(mappings[0].name, "share");
        assert.equal(mappings[0].hostPath, "/host/share");
    });

    test("parses multiple mappings", () => {
        const mappings = parseVmSharedFolderMappings({
            SharedFolderNameMachineMapping1: "share1",
            SharedFolderPathMachineMapping1: "/host/share1",
            SharedFolderNameMachineMapping2: "share2",
            SharedFolderPathMachineMapping2: "/host/share2",
        });

        assert.equal(mappings.length, 2);
        assert.equal(mappings[1].name, "share2");
    });

    test("uses empty string when host path is missing", () => {
        const mappings = parseVmSharedFolderMappings({
            SharedFolderNameMachineMapping1: "share",
        });

        assert.equal(mappings[0].hostPath, "");
    });
});
