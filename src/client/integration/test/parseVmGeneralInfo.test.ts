import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { parseVmGeneralInfo } from "../getVmInfo.ts";

describe("integration/parseVmGeneralInfo", () => {
    test("parses general fields", () => {
        const info = parseVmGeneralInfo({
            name: "Test VM",
            VMState: "running",
            cpus: "2",
            memory: "4096",
            ostype: "Ubuntu_64",
            vrde: "on",
            vrdeports: "3389",
        });

        assert.equal(info.name, "Test VM");
        assert.equal(info.vmState, "running");
        assert.equal(info.cpus, "2");
        assert.equal(info.memory, "4096");
        assert.equal(info.ostype, "Ubuntu_64");
        assert.equal(info.vrde, "on");
        assert.equal(info.vrdePorts, "3389");
    });

    test("returns empty strings and unknown for missing fields", () => {
        const info = parseVmGeneralInfo({});
        assert.equal(info.name, "");
        assert.equal(info.vmState, "unknown");
        assert.equal(info.cpus, "");
        assert.equal(info.memory, "");
        assert.equal(info.ostype, "");
        assert.equal(info.vrde, "");
        assert.equal(info.vrdePorts, "");
    });
});
