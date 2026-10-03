import { cpSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const src = path.join(root, "src");
const dist = path.join(root, "dist");

cpSync(src, dist, {
    recursive: true,
    filter: (source) => {
        if (source.endsWith(".ts")) return false;
        const relative = path.relative(src, source);
        if (relative === "") return true;
        const parts = relative.split(path.sep);
        if (parts.includes("test")) return false;
        return true;
    },
});

// Stamp the manifest version into index.html's <meta name="app-version"> tag so the
// UI can read it synchronously from the DOM instead of fetching manifest.json at runtime.
const { version } = JSON.parse(readFileSync(path.join(dist, "manifest.json"), "utf8"));
const indexPath = path.join(dist, "index.html");
const indexHtml = readFileSync(indexPath, "utf8");
writeFileSync(
    indexPath,
    indexHtml.replace(
        '<meta name="app-version" content="">',
        `<meta name="app-version" content="${version}">`,
    ),
);
