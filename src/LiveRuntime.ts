import { Runtime, Command, defs, Expression, CommandProvider, DataTypes } from 'expangine-runtime';



export type LiveContext = Record<string, any> | (any[] & Record<string, any>);

export type LiveResult = any;

export type LiveCommand = Command<LiveContext, LiveResult>;

export type LiveCommandMap<K extends string | number | symbol = string> = Record<K, LiveCommand>;

export type LiveProvider = CommandProvider<LiveContext, LiveResult>;

export class LiveRuntimeImpl extends Runtime<LiveContext, LiveResult>
{

  public strict: boolean;

  public objectSet: <O extends object, K extends keyof O>(obj: O, prop: K, value: O[K]) => void 
    = (obj, prop, value) => DataTypes.objectSet(obj, prop, value);
  public objectRemove: <O extends object, K extends keyof O>(obj: O, prop: K) => void
    = (obj, prop) => DataTypes.objectRemove(obj, prop);
  public arrayAdd: <T>(arr: T[], item: T) => void
    = (arr, item) => DataTypes.arrayAdd(arr, item);
  public arrayAddFirst: <T>(arr: T[], item: T) => void
    = (arr, item) => arr.unshift(item);
  public arrayRemoveLast: <T>(arr: T[]) => T
    = (arr) => arr.pop();
  public arrayRemoveFirst: <T>(arr: T[]) => T
    = (arr) => arr.shift();
  public arrayRemoveAt: <T>(arr: T[], index: number) => T
    = (arr, index) => DataTypes.arrayRemove(arr, index);
  public arrayInsert: <T>(arr: T[], index: number, item: T) => void
    = (arr, index, item) => arr.splice(index, 0, item);
  public arraySet: <T>(arr: T[], index: number, item: T) => T
    = (arr, index, item) => DataTypes.arraySet(arr, index, item);
  public arraySplice: <T>(arr: T[], index: number, remove: number, ...items: T[]) => T[]
    = (arr, index, remove, items) => arr.splice(index, remove, items);
  public arrayClear: <T>(arr: T[]) => T[]
    = (arr) => arr.splice(0, arr.length);

  public constructor()
  {
    super(defs);
    this.strict = true;
  }

  public wrapCommandWithReturn(cmd: LiveCommand): LiveCommand
  {
    return (context) => {
      const result = cmd(context);

      return this.returnProperty in context
        ? context[this.returnProperty]
        : result;
    };
  }

  public getCommandWithReturn(expr: Expression, provider: LiveProvider = this): LiveCommand
  {
    return this.wrapCommandWithReturn(this.getCommand(expr, provider));
  }

  public run(expr: any, context: LiveContext, provider: LiveProvider = this): LiveResult
  {
    return this.getCommandWithReturn(this.defs.getExpression(expr), provider)(context);
  }

}

export const LiveRuntime = new LiveRuntimeImpl();
