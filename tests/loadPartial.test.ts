import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { loadPartial } from "../src/tools/loadPartial.ts";

/** Untyped view of globalThis for stubbing `document`/`fetch` in tests. */
const domGlobal = globalThis as any;

describe("loadPartial with mocked DOM and fetch", () => {
    let fetchCalls: string[];
    let targets: Record<string, { innerHTML: string }>;

    beforeEach(() => {
        fetchCalls = [];
        targets = {};

        domGlobal.document = {
            querySelector(selector: string) {
                if (!targets[selector]) {
                    targets[selector] = { innerHTML: "" };
                }
                return targets[selector];
            },
        };

        let counter = 0;
        domGlobal.fetch = async (path: string) => {
            fetchCalls.push(path);
            const uniquePath = `${path}?t=${++counter}`;

            if (uniquePath.includes("app.html")) {
                return {
                    ok: true,
                    text: async () => '<div class="app">App</div>',
                };
            }
            if (uniquePath.includes("nested.html")) {
                return {
                    ok: true,
                    text: async () => '<x-include src="leaf.html"></x-include>',
                };
            }
            if (uniquePath.includes("leaf.html")) {
                return {
                    ok: true,
                    text: async () => '<span class="leaf">Leaf</span>',
                };
            }
            return {
                ok: false,
                status: 404,
                statusText: "Not Found",
            };
        };
    });

    afterEach(() => {
        delete domGlobal.document;
        delete domGlobal.fetch;
    });

    test("loads a partial into the target element", async () => {
        await loadPartial("partials/app.html", "#app");

        assert.equal(targets["#app"].innerHTML, '<div class="app">App</div>');
        assert.equal(fetchCalls.length, 1);
        assert.ok(fetchCalls[0].includes("app.html"));
    });

    test("resolves nested x-include tags", async () => {
        await loadPartial("partials/nested.html", "#app");

        assert.equal(targets["#app"].innerHTML, '<span class="leaf">Leaf</span>');
        assert.equal(fetchCalls.length, 2);
    });

    test("throws when target element is missing", async () => {
        delete domGlobal.document;
        domGlobal.document = { querySelector: () => null };

        await assert.rejects(
            () => loadPartial("partials/app.html", "#missing"),
            /Partial target not found/
        );
    });

    test("throws when partial HTTP request fails", async () => {
        await assert.rejects(
            () => loadPartial("partials/unknown.html", "#app"),
            /Failed to load partial/
        );
    });
});
