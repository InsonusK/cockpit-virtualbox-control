import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { getVmInfoHuman } from "../../../src/client/integration/getVmInfoHuman.ts";
import { createMockSpawn, cockpitGlobal } from "../../helpers/cockpitMock.ts";

const UUID = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";

describe("integration/getVmInfoHuman", () => {
    afterEach(() => {
        delete cockpitGlobal.cockpit;
    });

    test("calls showvminfo without --machinereadable", async () => {
        cockpitGlobal.cockpit = {
            spawn: createMockSpawn({
                [`showvminfo ${UUID}`]: "Name: 'Test VM'\n",
            }),
        };
        await getVmInfoHuman(UUID);
        const call = cockpitGlobal.cockpit.spawn.calls[0];
        assert.deepEqual(call.args, ["VBoxManage", "showvminfo", UUID]);
    });

    test("rejects invalid UUID", async () => {
        cockpitGlobal.cockpit = { spawn: createMockSpawn({}) };
        await assert.rejects(async () => getVmInfoHuman("not-a-uuid"), /Invalid VM UUID/);
    });

    test("returns empty array for empty output", async () => {
        cockpitGlobal.cockpit = { spawn: createMockSpawn({ [`showvminfo ${UUID}`]: "" }) };
        assert.deepEqual(await getVmInfoHuman(UUID), []);
    });

    test("parses shared folder with flags", async () => {
        cockpitGlobal.cockpit = {
            spawn: createMockSpawn({
                [`showvminfo ${UUID}`]: "Name: 'share', Host path: '/host/share' (machine mapping), readonly, auto-mount",
            }),
        };
        const result = await getVmInfoHuman(UUID);
        assert.equal(result.length, 1);
        assert.equal(result[0].name, "share");
        assert.equal(result[0].hostPath, "/host/share");
        assert.deepEqual(result[0].flags, ["readonly", "auto-mount"]);
    });

    test("parses shared folder without auto-mount", async () => {
        cockpitGlobal.cockpit = {
            spawn: createMockSpawn({
                [`showvminfo ${UUID}`]: "Name: 'code', Host path: '/home/user/code' (machine mapping), readonly",
            }),
        };
        const result = await getVmInfoHuman(UUID);
        assert.equal(result.length, 1);
        assert.deepEqual(result[0].flags, ["readonly"]);
    });
});
