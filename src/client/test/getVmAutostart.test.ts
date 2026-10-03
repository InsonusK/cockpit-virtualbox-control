import { test, describe, afterEach } from "node:test";
import assert from "node:assert/strict";
import { getVmAutostart } from "../getVmAutostart.ts";
import { createMockSpawn, cockpitGlobal } from "../../../tests/helpers/cockpitMock.ts";

const UUID = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";

describe("client/getVmAutostart", () => {
    afterEach(() => {
        delete cockpitGlobal.cockpit;
    });

    test("returns true when autostart is enabled", async () => {
        cockpitGlobal.cockpit = {
            spawn: createMockSpawn({
                [`showvminfo ${UUID} --machinereadable`]: 'autostart_enabled="on"\n',
            }),
        };
        assert.equal(await getVmAutostart(UUID), true);
    });

    test("returns false when autostart is disabled or missing", async () => {
        cockpitGlobal.cockpit = {
            spawn: createMockSpawn({
                [`showvminfo ${UUID} --machinereadable`]: 'name="Test"\n',
            }),
        };
        assert.equal(await getVmAutostart(UUID), false);
    });
});
