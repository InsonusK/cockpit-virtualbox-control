import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { controlVm } from "../controlVm.ts";
import { createMockSpawn, cockpitGlobal } from "../../../../tests/helpers/cockpitMock.ts";

const UUID = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";

describe("integration/controlVm", () => {
    beforeEach(() => {
        cockpitGlobal.cockpit = { spawn: createMockSpawn({}) };
    });

    afterEach(() => {
        delete cockpitGlobal.cockpit;
    });

    test("calls controlvm pause", async () => {
        await controlVm(UUID, "pause");
        const call = cockpitGlobal.cockpit.spawn.calls[0];
        assert.deepEqual(call.args, ["VBoxManage", "controlvm", UUID, "pause"]);
    });

    test("returns typed command result", async () => {
        cockpitGlobal.cockpit = { spawn: createMockSpawn({ [`controlvm ${UUID} pause`]: "ok" }) };
        const result = await controlVm(UUID, "pause");
        assert.equal(result.output, "ok");
    });

    test("rejects invalid control command", async () => {
        await assert.rejects(async () => controlVm(UUID, "reboot"), /Invalid VM control command/);
        assert.equal(cockpitGlobal.cockpit.spawn.calls.length, 0);
    });

    test("rejects invalid UUID", async () => {
        await assert.rejects(async () => controlVm("bad", "pause"), /Invalid VM UUID/);
    });
});
