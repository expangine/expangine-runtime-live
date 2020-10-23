import { Runtime, Command, defs, Expression, CommandProvider, DataTypes, FlowType } from 'expangine-runtime';



export type LiveContext = Record<string, any> | (any[] & Record<string, any>);

export type LiveResult = any;

export type LiveCommand = Command<LiveContext, LiveResult>;

export type LiveCommandMap<K extends string | number | symbol = string> = Record<K, LiveCommand>;

export type LiveProvider = CommandProvider<LiveContext, LiveResult>;

export interface LiveRuntimeOperations
{
  objectSet<O extends object, K extends keyof O>(obj: O, prop: K, value: O[K]): void;
  objectRemove<O extends object, K extends keyof O>(obj: O, prop: K): void;
  objectHas<O extends object>(obj: O, prop: string | number | symbol): boolean;
  dataSet<O extends object, K extends keyof O>(obj: O, prop: K, value: O[K]): boolean;
  dataGet<O extends object, K extends keyof O>(obj: O, prop: K): O[K];
  dataRemove<O extends object, K extends keyof O>(obj: O, prop: K): void;
  dataHas<O extends object>(obj: O, prop: string | number | symbol): boolean;
  dataCopy<V>(value: V): V;
  enterScope<R = any>(context: LiveContext, props: string[], run: (innerContext: LiveContext) => R): R;
  arrayAdd<T>(arr: T[], item: T): void;
  arrayAddFirst<T>(arr: T[], item: T): void;
  arrayRemoveLast<T>(arr: T[]): T;
  arrayRemoveFirst<T>(arr: T[]): T;
  arrayRemoveAt<T>(arr: T[], index: number): T;
  arrayInsert<T>(arr: T[], index: number, item: T): void;
  arraySet<T>(arr: T[], index: number, item: T): T;
  arraySplice<T>(arr: T[], index: number, remove: number, ...items: T[]): T[];
  arrayClear<T>(arr: T[]): T[];
}

export class LiveRuntimeImpl extends Runtime<LiveContext, LiveResult> implements LiveRuntimeOperations
{

  public strict: boolean;

  public objectSet: LiveRuntimeOperations['objectSet'] 
    = (obj, prop, value) => DataTypes.objectSet(obj, prop, value);
  public objectRemove: LiveRuntimeOperations['objectRemove'] 
    = (obj, prop) => DataTypes.objectRemove(obj, prop);
  public objectHas: LiveRuntimeOperations['objectHas'] 
    = (obj, prop) => prop in obj;

  public dataSet: LiveRuntimeOperations['dataSet'] 
    = (obj, prop, value) => DataTypes.set(obj, prop, value);
  public dataGet: LiveRuntimeOperations['dataGet'] 
    = (obj, prop) => DataTypes.get(obj, prop);
  public dataRemove: LiveRuntimeOperations['dataRemove'] 
    = (obj, prop) => DataTypes.remove(obj, prop);
  public dataHas: LiveRuntimeOperations['dataHas'] 
    = (obj, prop) => DataTypes.has(obj, prop);
  public dataCopy: LiveRuntimeOperations['dataCopy']
    = (value) => DataTypes.copy(value);

  public arrayAdd: LiveRuntimeOperations['arrayAdd'] 
    = (arr, item) => DataTypes.arrayAdd(arr, item);
  public arrayAddFirst: LiveRuntimeOperations['arrayAddFirst'] 
    = (arr, item) => arr.unshift(item);
  public arrayRemoveLast: LiveRuntimeOperations['arrayRemoveLast'] 
    = (arr) => arr.pop();
  public arrayRemoveFirst: LiveRuntimeOperations['arrayRemoveFirst'] 
    = (arr) => arr.shift();
  public arrayRemoveAt: LiveRuntimeOperations['arrayRemoveAt'] 
    = (arr, index) => DataTypes.arrayRemove(arr, index);
  public arrayInsert: LiveRuntimeOperations['arrayInsert'] 
    = (arr, index, item) => arr.splice(index, 0, item);
  public arraySet: LiveRuntimeOperations['arraySet'] 
    = (arr, index, item) => DataTypes.arraySet(arr, index, item);
  public arraySplice: LiveRuntimeOperations['arraySplice'] 
    = (arr, index, remove, items) => arr.splice(index, remove, items);
  public arrayClear: LiveRuntimeOperations['arrayClear'] 
    = (arr) => arr.splice(0, arr.length);

  public enterScope: LiveRuntimeOperations['enterScope'] = (context, props, run) => {
    const saved = props.map((p) => this.dataGet(context, p));
    const result = run(context);
    saved.forEach((last, i) =>
      last === undefined
        ? this.dataRemove(context, props[i])
        : this.dataSet(context, props[i], last)
    );

    return result;
  };

  public constructor()
  {
    super(defs);
    this.strict = true;
  }

  public wrapCommandWithReturn(cmd: LiveCommand): LiveCommand
  {
    return (context) => {
      const result = cmd(context);

      return this.dataHas(context, this.flowProperty)
        ? this.dataGet(context, this.flowProperty)[1]
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

  public flowChange(context: LiveContext, provider: LiveProvider = this): FlowType | false
  {
    return this.dataHas(context, provider.flowProperty)
      ? this.dataGet(context, provider.flowProperty)[0]
      : false;
  }

  public flowClear(context: LiveContext, provider: LiveProvider = this): void
  {
    this.dataRemove(context, provider.flowProperty);
  }

  public getCommandMap(context: LiveContext, commands: LiveCommandMap, provider: LiveProvider = this)
  {
    const obj = Object.create(null);

    for (const prop in commands) 
    {
      obj[prop] = commands[prop](context);

      if (this.flowChange(context, provider)) 
      {
        return;
      }
    }

    return obj; 
  }

}

export const LiveRuntime = new LiveRuntimeImpl();
