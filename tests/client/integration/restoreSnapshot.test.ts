import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { restoreSnapshot } from "../../../src/client/integration/restoreSnapshot.ts";
import { createMockSpawn, cockpitGlobal } from "../../helpers/cockpitMock.ts";

const UUID = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";

describe("integration/restoreSnapshot", () => {
    beforeEach(() => {
        cockpitGlobal.cockpit = { spawn: createMockSpawn({}) };
    });

    afterEach(() => {
        delete cockpitGlobal.cockpit;
    });

    test("calls snapshot restore", async () => {
        await restoreSnapshot(UUID, "clean");
        const call = cockpitGlobal.cockpit.spawn.calls[0];
        assert.deepEqual(call.args, ["VBoxManage", "snapshot", UUID, "restore", "clean"]);
    });

    test("returns typed command result", async () => {
        cockpitGlobal.cockpit = {
            spawn: createMockSpawn({ [`snapshot ${UUID} restore clean`]: "ok" }),
        };
        const result = await restoreSnapshot(UUID, "clean");
        assert.equal(result.output, "ok");
    });

    test("rejects empty snapshot name", async () => {
        await assert.rejects(async () => restoreSnapshot(UUID, ""), /Snapshot name is empty/);
    });

    test("rejects invalid UUID", async () => {
        await assert.rejects(async () => restoreSnapshot("bad", "clean"), /Invalid VM UUID/);
    });
});
