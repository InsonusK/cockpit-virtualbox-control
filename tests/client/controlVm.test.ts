import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { controlVm } from "../../src/client/controlVm.ts";
import { createMockSpawn, cockpitGlobal } from "../helpers/cockpitMock.ts";

const UUID = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";

describe("client/controlVm", () => {
    beforeEach(() => {
        cockpitGlobal.cockpit = { spawn: createMockSpawn({}) };
    });

    afterEach(() => {
        delete cockpitGlobal.cockpit;
    });

    test("calls integration controlvm and resolves to void", async () => {
        const result = await controlVm(UUID, "pause");
        assert.equal(result, undefined);
        const call = cockpitGlobal.cockpit.spawn.calls[0];
        assert.deepEqual(call.args, ["VBoxManage", "controlvm", UUID, "pause"]);
    });

    test("rejects invalid control command", async () => {
        await assert.rejects(async () => controlVm(UUID, "reboot"), /Invalid VM control command/);
    });

    test("rejects invalid UUID", async () => {
        await assert.rejects(async () => controlVm("bad", "pause"), /Invalid VM UUID/);
    });
});
