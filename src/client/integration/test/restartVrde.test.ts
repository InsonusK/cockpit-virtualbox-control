import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { restartVrde } from "../restartVrde.ts";
import { createMockSpawn, cockpitGlobal } from "../../../../tests/helpers/cockpitMock.ts";

const UUID = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";

describe("integration/restartVrde", () => {
    beforeEach(() => {
        cockpitGlobal.cockpit = { spawn: createMockSpawn({}) };
    });

    afterEach(() => {
        delete cockpitGlobal.cockpit;
    });

    test("turns vrde off then on", async () => {
        await restartVrde(UUID);
        const calls = cockpitGlobal.cockpit.spawn.calls;
        assert.deepEqual(calls[0].args, ["VBoxManage", "controlvm", UUID, "vrde", "off"]);
        assert.deepEqual(calls[1].args, ["VBoxManage", "controlvm", UUID, "vrde", "on"]);
    });

    test("returns typed command result from the final call", async () => {
        cockpitGlobal.cockpit = { spawn: createMockSpawn({ [`controlvm ${UUID} vrde on`]: "ok" }) };
        const result = await restartVrde(UUID);
        assert.equal(result.output, "ok");
    });

    test("rejects invalid UUID", async () => {
        await assert.rejects(async () => restartVrde("bad"), /Invalid VM UUID/);
        assert.equal(cockpitGlobal.cockpit.spawn.calls.length, 0);
    });
});
