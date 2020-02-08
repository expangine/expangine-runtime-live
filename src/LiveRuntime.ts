import { Runtime, Command, defs, Expression, CommandProvider } from 'expangine-runtime';



export type LiveContext = Record<string, any> | (any[] & Record<string, any>);

export type LiveResult = any;

export type LiveCommand = Command<LiveContext, LiveResult>;

export type LiveCommandMap<K extends string | number | symbol = string> = Record<K, LiveCommand>;

export type LiveProvider = CommandProvider<LiveContext, LiveResult>;

export class LiveRuntimeImpl extends Runtime<LiveContext, LiveResult>
{

  public instances: Record<string, Record<string, any>>;
  public strict: boolean;

  public constructor()
  {
    super(defs);
    this.instances = Object.create(null);
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
