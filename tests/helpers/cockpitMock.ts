/** Untyped view of globalThis for stubbing the `cockpit` global in tests. */
export const cockpitGlobal = globalThis as any;

export interface MockSpawnCall {
    args: string[];
    opts: any;
}

export interface MockSpawn {
    (args: string[], opts?: any): Promise<string>;
    calls: MockSpawnCall[];
}

/** Creates a mock cockpit.spawn that records every call and resolves with a response chosen from the provided map. */
export function createMockSpawn(responses: Record<string, string> = {}): MockSpawn {
    const calls: MockSpawnCall[] = [];
    function spawn(args: string[], opts?: any): Promise<string> {
        calls.push({ args, opts });
        const key = args.slice(1).join(" ");
        const output = responses[key] ?? "";
        return Promise.resolve(output);
    }
    spawn.calls = calls;
    return spawn;
}
