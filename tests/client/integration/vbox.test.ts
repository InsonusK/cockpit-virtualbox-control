import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { vbox } from "../../../src/client/integration/vbox.ts";
import { createMockSpawn, cockpitGlobal } from "../../helpers/cockpitMock.ts";

describe("integration/vbox", () => {
    afterEach(() => {
        delete cockpitGlobal.cockpit;
    });

    test("throws when cockpit global is missing", async () => {
        delete cockpitGlobal.cockpit;
        await assert.rejects(async () => vbox(["list", "vms"]), /cockpit is not available/);
    });

    test("propagates spawn rejection", async () => {
        cockpitGlobal.cockpit = {
            spawn: () => Promise.reject(new Error("VBoxManage not found")),
        };
        await assert.rejects(() => vbox(["list", "vms"]), /VBoxManage not found/);
    });

    test("passes VBoxManage as first argument and forwards options", async () => {
        cockpitGlobal.cockpit = { spawn: createMockSpawn({}) };
        await vbox(["list", "vms"]);
        const call = cockpitGlobal.cockpit.spawn.calls[0];
        assert.deepEqual(call.args, ["VBoxManage", "list", "vms"]);
        assert.deepEqual(call.opts, { err: "message", environ: ["LC_ALL=C"] });
    });
});
