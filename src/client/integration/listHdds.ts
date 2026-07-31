import { vbox } from "./vbox.ts";
import { parseMediumList } from "./parseMediumList.ts";
import type { VBoxMedium } from "./model.ts";

/** Lists registered hard disk images and returns typed VirtualBox medium models. */
export async function listHdds(): Promise<VBoxMedium[]> {
    const output = await vbox(["list", "hdds"]);
    return parseMediumList(output, "hdd");
}
