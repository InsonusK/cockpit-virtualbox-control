import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { listSnapshots } from "../listSnapshots.ts";
import { createMockSpawn, cockpitGlobal } from "../../../tests/helpers/cockpitMock.ts";

const UUID = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";

describe("client/listSnapshots", () => {
    afterEach(() => {
        delete cockpitGlobal.cockpit;
    });

    test("maps VirtualBox snapshot models to application names", async () => {
        cockpitGlobal.cockpit = {
            spawn: createMockSpawn({
                [`snapshot ${UUID} list --machinereadable`]: `
SnapshotName="base"
SnapshotName-1="after-update"
SnapshotName-2="checkpoint"
`,
            }),
        };
        const names = await listSnapshots(UUID);
        assert.deepEqual(names, ["base", "after-update", "checkpoint"]);
    });

    test("returns empty array when there are no snapshots", async () => {
        cockpitGlobal.cockpit = {
            spawn: createMockSpawn({
                [`snapshot ${UUID} list --machinereadable`]: "This machine does not have any snapshots\n",
            }),
        };
        assert.deepEqual(await listSnapshots(UUID), []);
    });

    test("propagates real errors", async () => {
        cockpitGlobal.cockpit = {
            spawn: () => Promise.reject(new Error("VM not found")),
        };
        await assert.rejects(() => listSnapshots(UUID), /VM not found/);
    });

    test("rejects invalid UUID", async () => {
        cockpitGlobal.cockpit = { spawn: createMockSpawn({}) };
        await assert.rejects(async () => listSnapshots("not-a-uuid"), /Invalid VM UUID/);
    });
});
