/** A shared folder configured for a VM. */
export interface SharedFolder {
    name: string;
    hostPath: string;
    guestPath: string;
    readOnly: boolean | null;
    autoMount: boolean | null;
}
