import type { VBoxMedium } from "./model.ts";

/**
 * Parses `VBoxManage list hdds` / `list dvds` output into medium objects.
 *
 * Blocks separated by blank lines become objects; only blocks with UUID are kept.
 */
export function parseMediumList(output: string | undefined, kind: "hdd" | "dvd"): VBoxMedium[] {
    const items: VBoxMedium[] = [];
    if (!output) return items;
    const blocks = output.trim().split(/\n\s*\n/);
    for (const block of blocks) {
        const map: Record<string, string> = {};
        const lines = block.trim().split("\n");
        for (const line of lines) {
            const m = line.match(/^([^:]+):\s*(.*)$/);
            if (m) map[m[1].trim()] = m[2].trim();
        }
        if (!map.UUID) continue;
        items.push({
            kind,
            uuid: map.UUID,
            parentUuid: map["Parent UUID"] || "",
            state: map.State || "",
            type: map.Type || "",
            location: map.Location || "",
            storageFormat: map["Storage format"] || "",
            capacity: map.Capacity || "",
            encryption: map.Encryption || "",
        });
    }
    return items;
}
