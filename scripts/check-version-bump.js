import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const [baseRef] = process.argv.slice(2);
if (!baseRef) {
    console.error("Usage: node scripts/check-version-bump.js <base-ref>");
    process.exit(1);
}

const SEMVER = /^(\d+)\.(\d+)\.(\d+)$/;

function parseVersion(raw, source) {
    const match = SEMVER.exec(String(raw));
    if (!match) {
        console.error(`${source}: version "${raw}" is not in X.Y.Z format`);
        process.exit(1);
    }
    return match.slice(1, 4).map(Number);
}

function compare(a, b) {
    for (let i = 0; i < 3; i++) {
        if (a[i] !== b[i]) return a[i] - b[i];
    }
    return 0;
}

const currentRaw = JSON.parse(readFileSync("src/manifest.json", "utf8")).version;
const baseRaw = JSON.parse(
    execFileSync("git", ["show", `${baseRef}:src/manifest.json`], { encoding: "utf8" }),
).version;

const current = parseVersion(currentRaw, "src/manifest.json");
const base = parseVersion(baseRaw, `${baseRef}:src/manifest.json`);

if (compare(current, base) <= 0) {
    console.error(
        `src/manifest.json version "${currentRaw}" must be greater than base version "${baseRaw}"`,
    );
    process.exit(1);
}

console.log(`OK: ${currentRaw} > ${baseRaw}`);
