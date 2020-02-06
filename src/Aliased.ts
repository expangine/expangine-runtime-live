import { Runtime, AliasedOps } from 'expangine-runtime';
import { LiveContext, LiveResult } from './LiveRuntime';


export default function(run: Runtime<LiveContext, LiveResult>)
{
  const ops = AliasedOps;

  run.setOperation(ops.newInstance, (params) => (context) => {
    const name = params.name(context);
    const aliased = run.defs.aliased[name];

    if (!aliased) {
      throw new Error(`The aliased type ${name} is not defined.`);
    }

    return aliased.create();
  });

};