import { createVm } from "../../client/index.ts";
import type { CreateVmOptions } from "../../client/index.ts";
import type { AlpineStatic } from "../../vendor/alpine.min.js";

type StatusCallback = (message: string, isError?: boolean) => void;
type RefreshCallback = () => Promise<void>;

export interface PortForwardingRuleForm {
    name: string;
    protocol: "tcp" | "udp";
    hostIp: string;
    hostPort: string;
    guestIp: string;
    guestPort: string;
}

export interface CreateVmModalStore {
    isOpen: boolean;
    loading: boolean;
    onStatus: StatusCallback | null;
    onRefresh: RefreshCallback | null;

    name: string;
    folder: string;
    isoPath: string;
    macAddress: string;
    vrdePort: string;
    memory: number;
    cpus: number;
    diskSizeGb: number;
    ostype: string;
    networkType: "bridged" | "nat";
    bridgeAdapter: string;
    cpuExecutionCap: number;
    portForwardings: PortForwardingRuleForm[];

    osTypes: string[];

    show(statusCallback: StatusCallback, refreshCallback: RefreshCallback): void;
    close(): void;
    setStatus(message: string, isError?: boolean): void;
    submit(): Promise<void>;
    reset(): void;
    addPortForwarding(): void;
    removePortForwarding(index: number): void;
}

const MAC_RE = /^[0-9a-fA-F]{12}$/;
const PORT_RE = /^\d+$/;

const OS_TYPES = [
    "Ubuntu_64",
    "Debian_64",
    "Fedora_64",
    "ArchLinux_64",
    "CentOS7_64",
    "RedHat_64",
    "Oracle_64",
    "Windows10_64",
    "Windows11_64",
    "Windows2016_64",
    "Windows2019_64",
    "Windows2022_64",
    "Other_Linux_64",
    "Other_64",
];

/** Registers the `createVmModal` Alpine.js store. */
export function registerCreateVmModal(Alpine: AlpineStatic): void {
    const store: CreateVmModalStore = {
        isOpen: false,
        loading: false,
        onStatus: null,
        onRefresh: null,

        name: "",
        folder: "",
        isoPath: "",
        macAddress: "0800275C4F1A",
        vrdePort: "3390",
        memory: 4096,
        cpus: 4,
        diskSizeGb: 75,
        ostype: "Ubuntu_64",
        networkType: "bridged",
        bridgeAdapter: "eno1",
        cpuExecutionCap: 100,
        portForwardings: [],

        osTypes: OS_TYPES,

        /** Opens the modal and wires status/refresh callbacks. */
        show(statusCallback, refreshCallback) {
            this.onStatus = statusCallback;
            this.onRefresh = refreshCallback;
            this.reset();
            this.isOpen = true;
        },

        /** Closes the modal and resets its state. */
        close() {
            this.isOpen = false;
            this.onStatus = null;
            this.onRefresh = null;
            this.reset();
        },

        /** Reports a status message back to the parent app if a callback is set. */
        setStatus(message: string, isError = false) {
            if (this.onStatus) {
                this.onStatus(message, isError);
            }
        },

        /** Validates the form and runs the VM creation commands. */
        async submit() {
            if (this.loading) return;

            const name = (this.name || "").trim();
            const folder = (this.folder || "").trim();
            const isoPath = (this.isoPath || "").trim();
            const macAddress = (this.macAddress || "").trim();
            const vrdePort = (this.vrdePort || "").trim();

            if (!name) {
                this.setStatus("Укажите имя виртуальной машины", true);
                return;
            }
            if (!folder) {
                this.setStatus("Укажите папку для виртуальной машины", true);
                return;
            }
            if (!isoPath) {
                this.setStatus("Укажите путь к ISO-образу", true);
                return;
            }
            if (!MAC_RE.test(macAddress)) {
                this.setStatus("MAC-адрес должен содержать 12 шестнадцатеричных символов", true);
                return;
            }
            if (!PORT_RE.test(vrdePort)) {
                this.setStatus("Порт VRDE должен быть числом", true);
                return;
            }
            if (this.memory <= 0 || this.cpus <= 0 || this.diskSizeGb <= 0) {
                this.setStatus("Память, CPU и размер диска должны быть больше 0", true);
                return;
            }

            let portForwardings: PortForwardingRuleForm[] = [];
            if (this.networkType === "nat") {
                const rules = this.portForwardings.filter(
                    (rule) => rule.name.trim() && rule.hostPort.trim() && rule.guestPort.trim()
                );
                const invalid = rules.some((rule) => !PORT_RE.test(rule.hostPort) || !PORT_RE.test(rule.guestPort));
                if (invalid) {
                    this.setStatus("Порты проброса должны быть числами", true);
                    return;
                }
                portForwardings = rules;
            }

            const options: CreateVmOptions = {
                name,
                folder,
                isoPath,
                macAddress: macAddress.toUpperCase(),
                vrdePort,
                memory: this.memory,
                cpus: this.cpus,
                diskSizeGb: this.diskSizeGb,
                ostype: (this.ostype || "Ubuntu_64").trim(),
                networkType: this.networkType,
                bridgeAdapter: (this.bridgeAdapter || "eno1").trim(),
                cpuExecutionCap: this.cpuExecutionCap,
                portForwardings,
            };

            this.loading = true;
            this.setStatus(`Создание виртуальной машины ${name}...`);
            try {
                await createVm(options);
                this.setStatus(`Виртуальная машина ${name} создана`);
                this.isOpen = false;
                if (this.onRefresh) {
                    await this.onRefresh();
                }
            } catch (e: any) {
                this.setStatus("Ошибка создания VM: " + ((e && e.message) || e || "неизвестная ошибка"), true);
            } finally {
                this.loading = false;
            }
        },

        /** Resets form fields to their default values. */
        reset() {
            this.name = "";
            this.folder = "";
            this.isoPath = "";
            this.macAddress = "0800275C4F1A";
            this.vrdePort = "3390";
            this.memory = 4096;
            this.cpus = 4;
            this.diskSizeGb = 75;
            this.ostype = "Ubuntu_64";
            this.networkType = "bridged";
            this.bridgeAdapter = "eno1";
            this.cpuExecutionCap = 100;
            this.portForwardings = [];
        },

        /** Adds a blank port forwarding rule. */
        addPortForwarding() {
            this.portForwardings.push({
                name: "",
                protocol: "tcp",
                hostIp: "",
                hostPort: "",
                guestIp: "",
                guestPort: "",
            });
        },

        /** Removes the port forwarding rule at the given index. */
        removePortForwarding(index: number) {
            this.portForwardings.splice(index, 1);
        },
    };

    Alpine.store("createVmModal", store);
}
