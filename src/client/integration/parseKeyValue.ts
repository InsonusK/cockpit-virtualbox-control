/**
 * Parses key=value pairs from machinereadable VBoxManage output.
 *
 * Unwraps quoted values. Keys and values are trimmed.
 */
export function parseKeyValue(output: string): Record<string, string> {
    const map: Record<string, string> = {};
    const re = /^"?([^"=\n]+)"?\s*=\s*(.*)$/gm;
    let match;
    while ((match = re.exec(output)) !== null) {
        let value = match[2].trim();
        if (value.startsWith('"') && value.endsWith('"')) {
            value = value.slice(1, -1);
        }
        map[match[1].trim()] = value;
    }
    return map;
}
