export {};

declare global {
    interface Cockpit {
        spawn(args: string[], opts?: { err?: string; environ?: string[] }): Promise<string>;
    }

    // eslint-disable-next-line no-var
    var cockpit: Cockpit | undefined;
}
