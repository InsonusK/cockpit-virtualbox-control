import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { getVmState } from "../getVmState.ts";
import { createMockSpawn, cockpitGlobal } from "../../../tests/helpers/cockpitMock.ts";

const UUID = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";

describe("client/getVmState", () => {
    afterEach(() => {
        delete cockpitGlobal.cockpit;
    });

    test("maps running state to application string", async () => {
        cockpitGlobal.cockpit = {
            spawn: createMockSpawn({
                [`showvminfo ${UUID} --machinereadable`]: 'VMState="running"\n',
            }),
        };
        assert.equal(await getVmState(UUID), "running");
    });

    test("maps unknown state when field is missing", async () => {
        cockpitGlobal.cockpit = {
            spawn: createMockSpawn({
                [`showvminfo ${UUID} --machinereadable`]: 'name="Test"\n',
            }),
        };
        assert.equal(await getVmState(UUID), "unknown");
    });
});
