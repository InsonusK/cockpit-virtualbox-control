import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { takeSnapshot } from "../../src/client/takeSnapshot.ts";
import { createMockSpawn, cockpitGlobal } from "../helpers/cockpitMock.ts";

const UUID = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";

describe("client/takeSnapshot", () => {
    beforeEach(() => {
        cockpitGlobal.cockpit = { spawn: createMockSpawn({}) };
    });

    afterEach(() => {
        delete cockpitGlobal.cockpit;
    });

    test("calls integration take snapshot and resolves to void", async () => {
        await takeSnapshot(UUID, "before-update");
        const call = cockpitGlobal.cockpit.spawn.calls[0];
        assert.deepEqual(call.args, ["VBoxManage", "snapshot", UUID, "take", "before-update"]);
    });

    test("trims snapshot name", async () => {
        await takeSnapshot(UUID, "  before-update  ");
        const call = cockpitGlobal.cockpit.spawn.calls[0];
        assert.deepEqual(call.args[4], "before-update");
    });

    test("rejects empty snapshot name", async () => {
        await assert.rejects(async () => takeSnapshot(UUID, "   "), /Snapshot name is empty/);
    });

    test("rejects invalid UUID", async () => {
        await assert.rejects(async () => takeSnapshot("bad", "name"), /Invalid VM UUID/);
    });
});
