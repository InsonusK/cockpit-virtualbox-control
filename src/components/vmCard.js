import { vmInfo, vmInfoHuman, listHdds, listDvds } from "../client/vboxClient.js";
import { parseVmDetails } from "../client/parser.js";
import { formatFlag } from "./utils.js";

/**
 * Registers the `vmCard` Alpine.js data component for a single VM card.
 *
 * @param {Object} Alpine — Alpine.js instance.
 */
export function registerVmCard(Alpine) {
    Alpine.data("vmCard", (vm, app) => ({
        vm,
        app,
        expanded: false,
        details: null,
        loadingDetails: false,

        formatFlag,

        /** Toggles the expanded details panel and loads VM details on first open. */
        async toggleDetails() {
            if (this.expanded) {
                this.expanded = false;
                this.details = null;
                return;
            }

            this.expanded = true;
            this.loadingDetails = true;
            try {
                const [info, hdds, dvds] = await Promise.all([
                    vmInfo(vm.uuid),
                    listHdds(),
                    listDvds(),
                ]);

                let humanInfo = "";
                try {
                    humanInfo = await vmInfoHuman(vm.uuid);
                } catch (e) {
                    console.warn("vmInfoHuman failed for", vm.uuid, e.message || e);
                }

                this.details = parseVmDetails(info, hdds, dvds, humanInfo);
            } catch (e) {
                app.setStatus("Ошибка: " + (e.message || e), true);
                this.details = null;
            } finally {
                this.loadingDetails = false;
            }
        },
    }));
}
