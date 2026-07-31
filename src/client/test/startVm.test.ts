import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { startVm } from "../startVm.ts";
import { createMockSpawn, cockpitGlobal } from "../../../tests/helpers/cockpitMock.ts";

const UUID = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";

describe("client/startVm", () => {
    beforeEach(() => {
        cockpitGlobal.cockpit = { spawn: createMockSpawn({}) };
    });

    afterEach(() => {
        delete cockpitGlobal.cockpit;
    });

    test("calls integration startvm and resolves to void", async () => {
        const result = await startVm(UUID, "headless");
        assert.equal(result, undefined);
        const call = cockpitGlobal.cockpit.spawn.calls[0];
        assert.deepEqual(call.args, ["VBoxManage", "startvm", UUID, "--type", "headless"]);
    });

    test("supports gui start", async () => {
        await startVm(UUID, "gui");
        const call = cockpitGlobal.cockpit.spawn.calls[0];
        assert.deepEqual(call.args, ["VBoxManage", "startvm", UUID, "--type", "gui"]);
    });

    test("rejects invalid start type", async () => {
        await assert.rejects(async () => startVm(UUID, "sdl"), /Invalid VM start type/);
    });

    test("rejects invalid UUID", async () => {
        await assert.rejects(async () => startVm("bad", "headless"), /Invalid VM UUID/);
    });
});
