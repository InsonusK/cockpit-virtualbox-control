import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { listVms } from "../listVms.ts";
import { createMockSpawn, cockpitGlobal } from "../../../../tests/helpers/cockpitMock.ts";

const UUID = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";

describe("integration/listVms", () => {
    beforeEach(() => {
        cockpitGlobal.cockpit = {
            spawn: createMockSpawn({
                "list vms": `"Test VM" {${UUID}}\n`,
            }),
        };
    });

    afterEach(() => {
        delete cockpitGlobal.cockpit;
    });

    test("calls VBoxManage list vms", async () => {
        await listVms();
        const call = cockpitGlobal.cockpit.spawn.calls[0];
        assert.deepEqual(call.args, ["VBoxManage", "list", "vms"]);
    });

    test("passes LC_ALL=C and err:message options", async () => {
        await listVms();
        const call = cockpitGlobal.cockpit.spawn.calls[0];
        assert.deepEqual(call.opts, { err: "message", environ: ["LC_ALL=C"] });
    });

    test("returns empty array for empty output", async () => {
        cockpitGlobal.cockpit = { spawn: createMockSpawn({ "list vms": "" }) };
        assert.deepEqual(await listVms(), []);
    });

    test("parses single VM", async () => {
        cockpitGlobal.cockpit = {
            spawn: createMockSpawn({
                "list vms": '"Ubuntu" {a1b2c3d4-e5f6-7890-abcd-ef1234567890}',
            }),
        };
        assert.deepEqual(await listVms(), [
            { name: "Ubuntu", uuid: "a1b2c3d4-e5f6-7890-abcd-ef1234567890" },
        ]);
    });

    test("parses multiple VMs", async () => {
        cockpitGlobal.cockpit = {
            spawn: createMockSpawn({
                "list vms": `
"Ubuntu" {a1b2c3d4-e5f6-7890-abcd-ef1234567890}
"Windows 10" {b2c3d4e5-f6a7-8901-bcde-f23456789012}
"CentOS" {c3d4e5f6-a7b8-9012-cdef-345678901234}
`,
            }),
        };
        const result = await listVms();
        assert.equal(result.length, 3);
        assert.equal(result[0].name, "Ubuntu");
        assert.equal(result[1].name, "Windows 10");
        assert.equal(result[2].name, "CentOS");
    });

    test("unescapes quotes in VM name", async () => {
        cockpitGlobal.cockpit = {
            spawn: createMockSpawn({
                "list vms": '"VM with \\"quotes\\"" {a1b2c3d4-e5f6-7890-abcd-ef1234567890}',
            }),
        };
        const result = await listVms();
        assert.equal(result[0].name, 'VM with "quotes"');
    });
});
