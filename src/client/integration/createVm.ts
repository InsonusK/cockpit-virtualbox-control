import { vbox } from "./vbox.ts";
import type { VBoxCommandResult } from "./model.ts";

export type NetworkType = "bridged" | "nat";

export interface PortForwardingRule {
    name: string;
    protocol: "tcp" | "udp";
    hostIp: string;
    hostPort: string;
    guestIp: string;
    guestPort: string;
}

/** Parameters required to create a new VirtualBox VM. */
export interface CreateVmOptions {
    name: string;
    folder: string;
    isoPath: string;
    macAddress: string;
    vrdePort: string;
    memory: number;
    cpus: number;
    diskSizeGb: number;
    ostype: string;
    networkType: NetworkType;
    bridgeAdapter: string;
    cpuExecutionCap: number;
    portForwardings: PortForwardingRule[];
}

/** Builds the absolute path to the new VDI file, matching the shell script layout. */
function buildVdiPath(folder: string, name: string): string {
    return `${folder}/${name}/${name}.vdi`;
}

/** Creates a new VM with storage, network and VRDE configured as in the original script. */
export async function createVm(options: CreateVmOptions): Promise<VBoxCommandResult[]> {
    const {
        name,
        folder,
        isoPath,
        macAddress,
        vrdePort,
        memory,
        cpus,
        diskSizeGb,
        ostype,
        networkType,
        bridgeAdapter,
        cpuExecutionCap,
        portForwardings,
    } = options;

    const vdiPath = buildVdiPath(folder, name);
    const diskSizeMb = diskSizeGb * 1024;

    const results: VBoxCommandResult[] = [];

    results.push({
        output: await vbox([
            "createvm",
            "--name", name,
            "--ostype", ostype,
            "--basefolder", folder,
            "--register",
        ]),
    });

    results.push({
        output: await vbox([
            "modifyvm", name,
            "--memory", String(memory),
            "--cpus", String(cpus),
            "--ioapic", "on",
            "--cpuexecutioncap", String(cpuExecutionCap),
        ]),
    });

    results.push({
        output: await vbox([
            "createmedium", "disk",
            "--filename", vdiPath,
            "--size", String(diskSizeMb),
            "--format", "VDI",
        ]),
    });

    results.push({
        output: await vbox([
            "storagectl", name,
            "--name", "SATA Controller",
            "--add", "sata",
            "--controller", "IntelAhci",
        ]),
    });

    results.push({
        output: await vbox([
            "storageattach", name,
            "--storagectl", "SATA Controller",
            "--port", "0",
            "--device", "0",
            "--type", "hdd",
            "--medium", vdiPath,
        ]),
    });

    results.push({
        output: await vbox([
            "storagectl", name,
            "--name", "IDE Controller",
            "--add", "ide",
        ]),
    });

    results.push({
        output: await vbox([
            "storageattach", name,
            "--storagectl", "IDE Controller",
            "--port", "0",
            "--device", "0",
            "--type", "dvddrive",
            "--medium", isoPath,
        ]),
    });

    if (networkType === "bridged") {
        results.push({
            output: await vbox([
                "modifyvm", name,
                "--nic1", "bridged",
                "--bridgeadapter1", bridgeAdapter,
                "--macaddress1", macAddress,
            ]),
        });
    } else {
        results.push({
            output: await vbox([
                "modifyvm", name,
                "--nic1", "nat",
            ]),
        });

        for (const rule of portForwardings) {
            const ruleSpec = [
                rule.name,
                rule.protocol,
                rule.hostIp,
                rule.hostPort,
                rule.guestIp,
                rule.guestPort,
            ].join(",");
            results.push({
                output: await vbox([
                    "modifyvm", name,
                    "--natpf1", ruleSpec,
                ]),
            });
        }
    }

    results.push({
        output: await vbox([
            "modifyvm", name,
            "--vrde", "on",
            "--vrdeport", vrdePort,
        ]),
    });

    return results;
}
