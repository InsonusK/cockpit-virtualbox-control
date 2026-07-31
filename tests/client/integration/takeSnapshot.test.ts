import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { takeSnapshot } from "../../../src/client/integration/takeSnapshot.ts";
import { createMockSpawn, cockpitGlobal } from "../../helpers/cockpitMock.ts";

const UUID = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";

describe("integration/takeSnapshot", () => {
    beforeEach(() => {
        cockpitGlobal.cockpit = { spawn: createMockSpawn({}) };
    });

    afterEach(() => {
        delete cockpitGlobal.cockpit;
    });

    test("calls snapshot take with trimmed name", async () => {
        await takeSnapshot(UUID, "  before-update  ");
        const call = cockpitGlobal.cockpit.spawn.calls[0];
        assert.deepEqual(call.args, ["VBoxManage", "snapshot", UUID, "take", "before-update"]);
    });

    test("returns typed command result", async () => {
        cockpitGlobal.cockpit = {
            spawn: createMockSpawn({ [`snapshot ${UUID} take before-update`]: "ok" }),
        };
        const result = await takeSnapshot(UUID, "before-update");
        assert.equal(result.output, "ok");
    });

    test("rejects empty snapshot name", async () => {
        await assert.rejects(async () => takeSnapshot(UUID, "   "), /Snapshot name is empty/);
        assert.equal(cockpitGlobal.cockpit.spawn.calls.length, 0);
    });

    test("rejects invalid UUID", async () => {
        await assert.rejects(async () => takeSnapshot("bad", "name"), /Invalid VM UUID/);
    });
});
