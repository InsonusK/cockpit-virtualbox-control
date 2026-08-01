import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { parseVmUsbFilters } from "../getVmInfo.ts";

describe("integration/parseVmUsbFilters", () => {
    test("returns empty array when no filters", () => {
        assert.deepEqual(parseVmUsbFilters({}), []);
    });

    test("parses USB filter with all fields", () => {
        const filters = parseVmUsbFilters({
            USBFilterActive1: "on",
            USBFilterName1: "Webcam",
            USBFilterVendorId1: "046d",
            USBFilterProductId1: "0825",
            USBFilterManufacturer1: "Logitech",
            USBFilterProduct1: "HD Webcam",
        });

        assert.equal(filters.length, 1);
        assert.equal(filters[0].index, 1);
        assert.equal(filters[0].name, "Webcam");
        assert.equal(filters[0].vendorId, "046d");
        assert.equal(filters[0].productId, "0825");
        assert.equal(filters[0].manufacturer, "Logitech");
        assert.equal(filters[0].product, "HD Webcam");
        assert.equal(filters[0].active, "on");
    });

    test("parses multiple filters", () => {
        const filters = parseVmUsbFilters({
            USBFilterActive1: "on",
            USBFilterName1: "First",
            USBFilterActive2: "off",
            USBFilterName2: "Second",
        });

        assert.equal(filters.length, 2);
        assert.equal(filters[0].name, "First");
        assert.equal(filters[1].name, "Second");
    });
});
