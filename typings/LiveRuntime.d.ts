import { Runtime, Command, Expression, CommandProvider } from 'expangine-runtime';
export declare type LiveContext = Record<string, any> | (any[] & Record<string, any>);
export declare type LiveResult = any;
export declare type LiveCommand = Command<LiveContext, LiveResult>;
export declare type LiveCommandMap<K extends string | number | symbol = string> = Record<K, LiveCommand>;
export declare type LiveProvider = CommandProvider<LiveContext, LiveResult>;
export declare class LiveRuntimeImpl extends Runtime<LiveContext, LiveResult> {
    instances: Record<string, Record<string, any>>;
    strict: boolean;
    constructor();
    wrapCommandWithReturn(cmd: LiveCommand): LiveCommand;
    getCommandWithReturn(expr: Expression, provider?: LiveProvider): LiveCommand;
    run(expr: any, context: LiveContext, provider?: LiveProvider): LiveResult;
}
export declare const LiveRuntime: LiveRuntimeImpl;
