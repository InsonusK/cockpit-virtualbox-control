import { cpSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const src = path.join(root, "src");
const dist = path.join(root, "dist");

cpSync(src, dist, {
    recursive: true,
    filter: (source) => !source.endsWith(".ts"),
});
