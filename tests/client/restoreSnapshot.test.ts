import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { restoreSnapshot } from "../../src/client/restoreSnapshot.ts";
import { createMockSpawn, cockpitGlobal } from "../helpers/cockpitMock.ts";

const UUID = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";

describe("client/restoreSnapshot", () => {
    beforeEach(() => {
        cockpitGlobal.cockpit = { spawn: createMockSpawn({}) };
    });

    afterEach(() => {
        delete cockpitGlobal.cockpit;
    });

    test("calls integration restore snapshot and resolves to void", async () => {
        await restoreSnapshot(UUID, "clean");
        const call = cockpitGlobal.cockpit.spawn.calls[0];
        assert.deepEqual(call.args, ["VBoxManage", "snapshot", UUID, "restore", "clean"]);
    });

    test("rejects empty snapshot name", async () => {
        await assert.rejects(async () => restoreSnapshot(UUID, ""), /Snapshot name is empty/);
    });

    test("rejects invalid UUID", async () => {
        await assert.rejects(async () => restoreSnapshot("bad", "clean"), /Invalid VM UUID/);
    });
});
