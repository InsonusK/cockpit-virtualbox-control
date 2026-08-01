import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { parseKeyValue } from "../parseKeyValue.ts";

describe("integration/parseKeyValue", () => {
    test("parses simple pairs", () => {
        const map = parseKeyValue('name="value"\nfoo=bar');
        assert.equal(map.name, "value");
        assert.equal(map.foo, "bar");
    });

    test("strips surrounding quotes", () => {
        const map = parseKeyValue('key="quoted value"');
        assert.equal(map.key, "quoted value");
    });

    test("handles unquoted values", () => {
        const map = parseKeyValue('cpus=2\nmemory=4096');
        assert.equal(map.cpus, "2");
        assert.equal(map.memory, "4096");
    });

    test("returns empty object for empty output", () => {
        assert.deepEqual(parseKeyValue(""), {});
    });

    test("keeps keys with spaces", () => {
        const map = parseKeyValue('"SATA Controller-0-0"="/path/disk.vdi"');
        assert.equal(map["SATA Controller-0-0"], "/path/disk.vdi");
    });
});
