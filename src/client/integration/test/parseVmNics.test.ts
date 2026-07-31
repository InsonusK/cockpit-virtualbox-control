import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { parseVmNics } from "../getVmInfo.ts";

describe("integration/parseVmNics", () => {
    test("returns empty array when no NICs configured", () => {
        assert.deepEqual(parseVmNics({}), []);
    });

    test("parses single NAT adapter with port forwarding", () => {
        const nics = parseVmNics({
            nic1: "nat",
            macaddress1: "080027AABBCC",
            cableconnected1: "on",
            "Forwarding(0)": "ssh,tcp,,2222,,22",
        });

        assert.equal(nics.length, 1);
        assert.equal(nics[0].slot, 1);
        assert.equal(nics[0].type, "nat");
        assert.equal(nics[0].macAddress, "080027AABBCC");
        assert.equal(nics[0].cableConnected, "on");
        assert.equal(nics[0].portForwarding.length, 1);
        assert.equal(nics[0].portForwarding[0].name, "ssh");
        assert.equal(nics[0].portForwarding[0].hostPort, "2222");
        assert.equal(nics[0].portForwarding[0].guestPort, "22");
    });

    test("skips disabled NICs", () => {
        const nics = parseVmNics({
            nic1: "none",
            nic2: "bridged",
            macaddress2: "080027AABBDD",
        });

        assert.equal(nics.length, 1);
        assert.equal(nics[0].slot, 2);
        assert.equal(nics[0].type, "bridged");
    });

    test("parses multiple port forwarding rules", () => {
        const nics = parseVmNics({
            nic1: "nat",
            "Forwarding(0)": "ssh,tcp,,2222,,22",
            "Forwarding(1)": "http,tcp,,8080,,80",
        });

        assert.equal(nics[0].portForwarding.length, 2);
        assert.equal(nics[0].portForwarding[1].name, "http");
    });
});
