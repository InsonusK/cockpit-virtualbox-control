import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { startVm } from "../startVm.ts";
import { createMockSpawn, cockpitGlobal } from "../../../../tests/helpers/cockpitMock.ts";

const UUID = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";

describe("integration/startVm", () => {
    beforeEach(() => {
        cockpitGlobal.cockpit = { spawn: createMockSpawn({}) };
    });

    afterEach(() => {
        delete cockpitGlobal.cockpit;
    });

    test("calls startvm --type headless", async () => {
        await startVm(UUID, "headless");
        const call = cockpitGlobal.cockpit.spawn.calls[0];
        assert.deepEqual(call.args, ["VBoxManage", "startvm", UUID, "--type", "headless"]);
    });

    test("calls startvm --type gui", async () => {
        await startVm(UUID, "gui");
        const call = cockpitGlobal.cockpit.spawn.calls[0];
        assert.deepEqual(call.args, ["VBoxManage", "startvm", UUID, "--type", "gui"]);
    });

    test("returns typed command result", async () => {
        cockpitGlobal.cockpit = { spawn: createMockSpawn({ [`startvm ${UUID} --type headless`]: "ok" }) };
        const result = await startVm(UUID, "headless");
        assert.equal(result.output, "ok");
    });

    test("rejects invalid start type", async () => {
        await assert.rejects(async () => startVm(UUID, "sdl"), /Invalid VM start type/);
        assert.equal(cockpitGlobal.cockpit.spawn.calls.length, 0);
    });

    test("rejects invalid UUID", async () => {
        await assert.rejects(async () => startVm("bad", "headless"), /Invalid VM UUID/);
    });
});
