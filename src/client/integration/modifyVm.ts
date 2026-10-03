import { vbox, assertUuid } from "./vbox.ts";
import type { VBoxCommandResult } from "./model.ts";

/** Desired state of a single USB filter after editing. */
export interface UsbFilterInput {
    name: string;
    vendorId: string;
    productId: string;
    active: boolean;
}

/** Desired state of a single shared folder after editing. */
export interface SharedFolderInput {
    name: string;
    hostPath: string;
    readOnly: boolean;
    autoMount: boolean;
}

/** Parameters for editing an existing VM's configuration. */
export interface ModifyVmOptions {
    memory: number;
    cpus: number;
    vrdeEnabled: boolean;
    vrdePort: string;
    autostart: boolean;
    usbFilters: UsbFilterInput[];
    sharedFolders: SharedFolderInput[];
}

/**
 * Applies general, VRDE and autostart settings, then replaces the VM's USB filters
 * and shared folders with the given lists (existing ones are removed first, since
 * VBoxManage addresses USB filters by position and shared folders by name).
 *
 * Each VBoxManage call runs independently and failures are collected rather than
 * aborting the sequence: --memory/--cpus requires the VM to be powered off (VBoxManage
 * rejects it with VBOX_E_INVALID_VM_STATE otherwise), but that must not prevent
 * unrelated settings like --autostart-enabled or --vrde from being applied.
 */
export async function modifyVm(
    uuid: string,
    existingUsbFilterCount: number,
    existingSharedFolderNames: string[],
    options: ModifyVmOptions,
): Promise<VBoxCommandResult[]> {
    assertUuid(uuid);
    const results: VBoxCommandResult[] = [];
    const errors: string[] = [];

    async function run(args: string[]): Promise<void> {
        try {
            results.push({ output: await vbox(args) });
        } catch (e: any) {
            errors.push(e?.message || String(e));
        }
    }

    await run(["modifyvm", uuid, "--memory", String(options.memory), "--cpus", String(options.cpus)]);

    await run(["modifyvm", uuid, "--autostart-enabled", options.autostart ? "on" : "off"]);

    await run(
        options.vrdeEnabled
            ? ["modifyvm", uuid, "--vrde", "on", "--vrdeport", options.vrdePort]
            : ["modifyvm", uuid, "--vrde", "off"],
    );

    for (let i = existingUsbFilterCount; i >= 1; i--) {
        await run(["usbfilter", "remove", String(i), "--target", uuid]);
    }

    for (let i = 0; i < options.usbFilters.length; i++) {
        const filter = options.usbFilters[i];
        const args = [
            "usbfilter", "add", String(i + 1),
            "--target", uuid,
            "--name", filter.name,
            "--action", "hold",
            "--active", filter.active ? "yes" : "no",
        ];
        if (filter.vendorId) args.push("--vendorid", filter.vendorId);
        if (filter.productId) args.push("--productid", filter.productId);
        await run(args);
    }

    for (const name of existingSharedFolderNames) {
        await run(["sharedfolder", "remove", uuid, "--name", name]);
    }

    for (const folder of options.sharedFolders) {
        const args = ["sharedfolder", "add", uuid, "--name", folder.name, "--hostpath", folder.hostPath];
        if (folder.readOnly) args.push("--readonly");
        if (folder.autoMount) args.push("--automount");
        await run(args);
    }

    if (errors.length > 0) {
        throw new Error(errors.join("\n"));
    }

    return results;
}
