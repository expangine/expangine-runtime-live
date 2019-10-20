import { Runtime, Command } from 'expangine-runtime';
export declare type LiveContext = Record<string, any> | (any[] & Record<string, any>);
export declare type LiveResult = any;
export declare type LiveCommand = Command<LiveContext, LiveResult>;
export declare type LiveCommandMap<K extends string | number | symbol = string> = Record<K, LiveCommand>;
export declare const LiveRuntime: Runtime<LiveContext, any>;
