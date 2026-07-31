import { vbox } from "./vbox.ts";
import { parseMediumList } from "./parseMediumList.ts";
import type { VBoxMedium } from "./model.ts";

/** Lists registered DVD images and returns typed VirtualBox medium models. */
export async function listDvds(): Promise<VBoxMedium[]> {
    const output = await vbox(["list", "dvds"]);
    return parseMediumList(output, "dvd");
}
