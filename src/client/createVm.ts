import { createVm as integrationCreateVm } from "./integration/index.ts";
import type { CreateVmOptions } from "./integration/index.ts";

/** Creates a new VirtualBox VM with the configured parameters. */
export async function createVm(options: CreateVmOptions): Promise<void> {
    await integrationCreateVm(options);
}

export type { CreateVmOptions };
