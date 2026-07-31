import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { listHdds } from "../listHdds.ts";
import { createMockSpawn, cockpitGlobal } from "../../../../tests/helpers/cockpitMock.ts";

describe("integration/listHdds", () => {
    afterEach(() => {
        delete cockpitGlobal.cockpit;
    });

    test("calls VBoxManage list hdds", async () => {
        cockpitGlobal.cockpit = { spawn: createMockSpawn({ "list hdds": "" }) };
        await listHdds();
        const call = cockpitGlobal.cockpit.spawn.calls[0];
        assert.deepEqual(call.args, ["VBoxManage", "list", "hdds"]);
    });

    test("returns empty array for empty output", async () => {
        cockpitGlobal.cockpit = { spawn: createMockSpawn({ "list hdds": "" }) };
        assert.deepEqual(await listHdds(), []);
    });

    test("parses single medium block with real VBoxManage fields", async () => {
        const output = `
UUID:           0fe10dbc-ef6b-4800-b1d2-c889ae921167
Parent UUID:    base
State:          locked write
Type:           normal (base)
Location:       /mnt/nvme/VM/ik-microk8s-dev/ik-microk8s-dev.vdi
Storage format: VDI
Capacity:       76800 MBytes
Encryption:     disabled
`;
        cockpitGlobal.cockpit = { spawn: createMockSpawn({ "list hdds": output }) };
        const result = await listHdds();
        assert.equal(result.length, 1);
        assert.equal(result[0].kind, "hdd");
        assert.equal(result[0].uuid, "0fe10dbc-ef6b-4800-b1d2-c889ae921167");
        assert.equal(result[0].parentUuid, "base");
        assert.equal(result[0].state, "locked write");
        assert.equal(result[0].type, "normal (base)");
        assert.equal(result[0].location, "/mnt/nvme/VM/ik-microk8s-dev/ik-microk8s-dev.vdi");
        assert.equal(result[0].storageFormat, "VDI");
        assert.equal(result[0].capacity, "76800 MBytes");
        assert.equal(result[0].encryption, "disabled");
    });

    test("parses multiple medium blocks", async () => {
        const output = `
UUID:           u1
Location:       /d1.vdi
Capacity:       10240 MBytes
Encryption:     disabled

UUID:           u2
Location:       /d2.vdi
Capacity:       20480 MBytes
Encryption:     enabled
`;
        cockpitGlobal.cockpit = { spawn: createMockSpawn({ "list hdds": output }) };
        const result = await listHdds();
        assert.equal(result.length, 2);
        assert.equal(result[0].uuid, "u1");
        assert.equal(result[0].capacity, "10240 MBytes");
        assert.equal(result[1].uuid, "u2");
        assert.equal(result[1].capacity, "20480 MBytes");
    });

    test("skips blocks without UUID", async () => {
        const output = `
Location:       /no-uuid.vdi

UUID:           u1
Location:       /d1.vdi
`;
        cockpitGlobal.cockpit = { spawn: createMockSpawn({ "list hdds": output }) };
        const result = await listHdds();
        assert.equal(result.length, 1);
        assert.equal(result[0].uuid, "u1");
    });
});
