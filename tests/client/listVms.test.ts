import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { listVms } from "../../src/client/listVms.ts";
import { createMockSpawn, cockpitGlobal } from "../helpers/cockpitMock.ts";

const UUID = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";

describe("client/listVms", () => {
    afterEach(() => {
        delete cockpitGlobal.cockpit;
    });

    test("maps VirtualBox VM list to application model", async () => {
        cockpitGlobal.cockpit = {
            spawn: createMockSpawn({
                "list vms": `"Test VM" {${UUID}}\n`,
            }),
        };
        const vms = await listVms();
        assert.equal(vms.length, 1);
        assert.equal(vms[0].name, "Test VM");
        assert.equal(vms[0].uuid, UUID);
    });

    test("returns empty array when VirtualBox returns nothing", async () => {
        cockpitGlobal.cockpit = { spawn: createMockSpawn({ "list vms": "" }) };
        const vms = await listVms();
        assert.deepEqual(vms, []);
    });
});
