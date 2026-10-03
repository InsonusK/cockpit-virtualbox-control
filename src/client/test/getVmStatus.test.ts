import { test, describe, afterEach } from "node:test";
import assert from "node:assert/strict";
import { getVmStatus } from "../getVmStatus.ts";
import { createMockSpawn, cockpitGlobal } from "../../../tests/helpers/cockpitMock.ts";

const UUID = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";

describe("client/getVmStatus", () => {
    afterEach(() => {
        delete cockpitGlobal.cockpit;
    });

    test("reads state and autostart from a single showvminfo call", async () => {
        const spawn = createMockSpawn({
            [`showvminfo ${UUID} --machinereadable`]: 'VMState="running"\nautostart_enabled="on"\n',
        });
        cockpitGlobal.cockpit = { spawn };

        const status = await getVmStatus(UUID);

        assert.deepEqual(status, { state: "running", autostart: true });
        assert.equal(spawn.calls.length, 1);
    });

    test("defaults autostart to false when disabled or missing", async () => {
        cockpitGlobal.cockpit = {
            spawn: createMockSpawn({
                [`showvminfo ${UUID} --machinereadable`]: 'VMState="poweroff"\n',
            }),
        };

        const status = await getVmStatus(UUID);

        assert.deepEqual(status, { state: "poweroff", autostart: false });
    });
});
