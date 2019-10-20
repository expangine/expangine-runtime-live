import { Runtime, Command, defs } from 'expangine-runtime';



export type LiveContext = Record<string, any> | (any[] & Record<string, any>);

export type LiveResult = any;

export type LiveCommand = Command<LiveContext, LiveResult>;

export type LiveCommandMap<K extends string | number | symbol = string> = Record<K, LiveCommand>;

export const LiveRuntime = new Runtime<LiveContext, LiveResult>(defs);
