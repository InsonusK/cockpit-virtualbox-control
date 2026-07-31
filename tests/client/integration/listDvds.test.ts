import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { listDvds } from "../../../src/client/integration/listDvds.ts";
import { createMockSpawn, cockpitGlobal } from "../../helpers/cockpitMock.ts";

describe("integration/listDvds", () => {
    afterEach(() => {
        delete cockpitGlobal.cockpit;
    });

    test("calls VBoxManage list dvds", async () => {
        cockpitGlobal.cockpit = { spawn: createMockSpawn({ "list dvds": "" }) };
        await listDvds();
        const call = cockpitGlobal.cockpit.spawn.calls[0];
        assert.deepEqual(call.args, ["VBoxManage", "list", "dvds"]);
    });

    test("returns empty array for empty output", async () => {
        cockpitGlobal.cockpit = { spawn: createMockSpawn({ "list dvds": "" }) };
        assert.deepEqual(await listDvds(), []);
    });

    test("sets kind to dvd and parses blocks", async () => {
        const output = `
UUID:           iso-uuid
Type:           readonly
Location:       /path/disk.iso

Location:       /no-uuid.iso
`;
        cockpitGlobal.cockpit = { spawn: createMockSpawn({ "list dvds": output }) };
        const result = await listDvds();
        assert.equal(result.length, 1);
        assert.equal(result[0].kind, "dvd");
        assert.equal(result[0].uuid, "iso-uuid");
        assert.equal(result[0].type, "readonly");
        assert.equal(result[0].location, "/path/disk.iso");
    });
});
