import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { getVmInfo } from "../getVmInfo.ts";
import { createMockSpawn, cockpitGlobal } from "../../../../tests/helpers/cockpitMock.ts";

const UUID = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";

describe("integration/getVmInfo", () => {
    afterEach(() => {
        delete cockpitGlobal.cockpit;
    });

    test("calls showvminfo with --machinereadable", async () => {
        cockpitGlobal.cockpit = {
            spawn: createMockSpawn({
                [`showvminfo ${UUID} --machinereadable`]: 'VMState="running"\n',
            }),
        };
        await getVmInfo(UUID);
        const call = cockpitGlobal.cockpit.spawn.calls[0];
        assert.deepEqual(call.args, ["VBoxManage", "showvminfo", UUID, "--machinereadable"]);
    });

    test("rejects invalid UUID", async () => {
        cockpitGlobal.cockpit = { spawn: createMockSpawn({}) };
        await assert.rejects(async () => getVmInfo("not-a-uuid"), /Invalid VM UUID/);
        assert.equal(cockpitGlobal.cockpit.spawn.calls.length, 0);
    });
});
