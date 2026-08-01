import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { listSnapshots } from "../listSnapshots.ts";
import { createMockSpawn, cockpitGlobal } from "../../../../tests/helpers/cockpitMock.ts";

const UUID = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";

describe("integration/listSnapshots", () => {
    afterEach(() => {
        delete cockpitGlobal.cockpit;
    });

    test("calls snapshot list --machinereadable", async () => {
        cockpitGlobal.cockpit = {
            spawn: createMockSpawn({
                [`snapshot ${UUID} list --machinereadable`]: 'SnapshotName="clean"\n',
            }),
        };
        await listSnapshots(UUID);
        const call = cockpitGlobal.cockpit.spawn.calls[0];
        assert.deepEqual(call.args, ["VBoxManage", "snapshot", UUID, "list", "--machinereadable"]);
    });

    test("parses snapshot list", async () => {
        cockpitGlobal.cockpit = {
            spawn: createMockSpawn({
                [`snapshot ${UUID} list --machinereadable`]: `
SnapshotName="base"
SnapshotName-1="after-update"
SnapshotName-2="checkpoint"
`,
            }),
        };
        const result = await listSnapshots(UUID);
        assert.equal(result.length, 3);
        assert.equal(result[0].name, "base");
        assert.equal(result[1].name, "after-update");
        assert.equal(result[2].name, "checkpoint");
    });

    test("returns empty array when VBoxManage reports no snapshots", async () => {
        cockpitGlobal.cockpit = {
            spawn: createMockSpawn({
                [`snapshot ${UUID} list --machinereadable`]: "This machine does not have any snapshots\n",
            }),
        };
        assert.deepEqual(await listSnapshots(UUID), []);
    });

    test("treats empty rejection as empty snapshot list", async () => {
        cockpitGlobal.cockpit = {
            spawn: () => Promise.reject(""),
        };
        assert.deepEqual(await listSnapshots(UUID), []);
    });

    test("propagates real snapshot errors", async () => {
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
