import { Runtime, Command, Expression, CommandProvider } from 'expangine-runtime';
export declare type LiveContext = Record<string, any> | (any[] & Record<string, any>);
export declare type LiveResult = any;
export declare type LiveCommand = Command<LiveContext, LiveResult>;
export declare type LiveCommandMap<K extends string | number | symbol = string> = Record<K, LiveCommand>;
export declare type LiveProvider = CommandProvider<LiveContext, LiveResult>;
export declare class LiveRuntimeImpl extends Runtime<LiveContext, LiveResult> {
    instances: Record<string, Record<string, any>>;
    strict: boolean;
    objectSet: <O extends object, K extends keyof O>(obj: O, prop: K, value: O[K]) => void;
    objectRemove: <O extends object, K extends keyof O>(obj: O, prop: K) => void;
    arrayAdd: <T>(arr: T[], item: T) => void;
    arrayAddFirst: <T>(arr: T[], item: T) => void;
    arrayRemoveLast: <T>(arr: T[]) => T;
    arrayRemoveFirst: <T>(arr: T[]) => T;
    arrayRemoveAt: <T>(arr: T[], index: number) => T;
    arrayInsert: <T>(arr: T[], index: number, item: T) => void;
    arraySet: <T>(arr: T[], index: number, item: T) => T;
    arraySplice: <T>(arr: T[], index: number, remove: number, ...items: T[]) => T[];
    arrayClear: <T>(arr: T[]) => T[];
    constructor();
    wrapCommandWithReturn(cmd: LiveCommand): LiveCommand;
    getCommandWithReturn(expr: Expression, provider?: LiveProvider): LiveCommand;
    run(expr: any, context: LiveContext, provider?: LiveProvider): LiveResult;
}
export declare const LiveRuntime: LiveRuntimeImpl;
