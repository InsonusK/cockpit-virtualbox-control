/** A network adapter attached to a VM. */
export interface NetworkAdapter {
    slot: number;
    type: string;
    mac: string;
    enabled: boolean;
    portForwarding: string[];
}
