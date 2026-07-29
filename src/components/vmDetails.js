import { formatFlag } from "./utils.js";

export function registerVmDetails(Alpine) {
    Alpine.data("vmDetails", () => ({
        formatFlag,
    }));
}
