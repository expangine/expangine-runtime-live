
import { Runtime, BooleanOps, isBoolean, COMPONENT_MAX } from 'expangine-runtime';
import { _bool, _asList, _asObject, _asTuple, _asMap, _boolMaybe } from './helper';
import { LiveContext, LiveResult } from './LiveRuntime';


export default function(run: Runtime<LiveContext, LiveResult>)
{
  const ops = BooleanOps;

  // Static

  run.setOperation(ops.create, (params) => (context) =>
    false
  );

  // Operations

  run.setOperation(ops.maybe, (params) => (context) => 
    _boolMaybe(params.value, context)
  );

  run.setOperation(ops.and, (params) => (context) => 
    _bool(params.a, context) && _bool(params.b, context)
  );

  run.setOperation(ops.or, (params) => (context) => 
    _bool(params.a, context) || _bool(params.b, context)
  );

  run.setOperation(ops.xor, (params) => (context) => 
    _bool(params.a, context) !== _bool(params.b, context)
  );

  run.setOperation(ops.not, (params) => (context) => 
    !_bool(params.a, context)
  );

  run.setOperation(ops.cmp, (params) => (context) => 
    (_bool(params.value, context) ? 1 : 0) - (_bool(params.test, context) ? 1 : 0)
  );

  // Comparisons

  run.setOperation(ops.isValid, (params) => (context) => 
    isBoolean(params.value(context))
  );

  run.setOperation(ops.isTrue, (params) => (context) => 
    _bool(params.value, context, false)
  );

  run.setOperation(ops.isFalse, (params) => (context) => 
    !_bool(params.value, context, false)
  );

  // Casts

  run.setOperation(ops.asAny, (params) => (context) =>
    params.value(context)
  );

  run.setOperation(ops.asBoolean, (params) => (context) =>
    !!params.value(context)
  );

  run.setOperation(ops.asColor, (params) => (context) =>
    ({ r: COMPONENT_MAX, g: COMPONENT_MAX, b: COMPONENT_MAX, a: COMPONENT_MAX })
  );

  run.setOperation(ops.asDate, (params) => (context) =>
    new Date()
  );

  run.setOperation(ops.asList, (params) => (context) =>
    _asList(params.value, context)
  );

  run.setOperation(ops.asMap, (params) => (context) =>
    _asMap(params.value, context)
  );

  run.setOperation(ops.asNumber, (params) => (context) => {
    const value = params.value(context);

    return value ? 1 : 0;
  });

  run.setOperation(ops.asObject, (params) => (context) => 
    _asObject(params.value, context)
  );

  run.setOperation(ops.asText, (params) => (context) => 
    params.value(context) ? 'true' : 'false'
  );

  run.setOperation(ops.asTuple, (params) => (context) => 
    _asTuple(params.value, context)
  );

}