import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { restartVrde } from "../restartVrde.ts";
import { createMockSpawn, cockpitGlobal } from "../../../tests/helpers/cockpitMock.ts";

const UUID = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";

describe("client/restartVrde", () => {
    beforeEach(() => {
        cockpitGlobal.cockpit = { spawn: createMockSpawn({}) };
    });

    afterEach(() => {
        delete cockpitGlobal.cockpit;
    });

    test("calls integration restartVrde and resolves to void", async () => {
        const result = await restartVrde(UUID);
        assert.equal(result, undefined);
        const calls = cockpitGlobal.cockpit.spawn.calls;
        assert.deepEqual(calls[0].args, ["VBoxManage", "controlvm", UUID, "vrde", "off"]);
        assert.deepEqual(calls[1].args, ["VBoxManage", "controlvm", UUID, "vrde", "on"]);
    });

    test("rejects invalid UUID", async () => {
        await assert.rejects(async () => restartVrde("bad"), /Invalid VM UUID/);
    });
});
