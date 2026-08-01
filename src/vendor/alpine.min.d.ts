export interface AlpineStatic {
    data(name: string, callback: (...args: any[]) => object): void;
    store<T = any>(name: string): T;
    store(name: string, value: object): void;
    start(): void;
}

declare const Alpine: AlpineStatic;
export default Alpine;
