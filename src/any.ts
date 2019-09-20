import { Runtime, AnyOps, parse, compare, copy, toString } from 'expangine-runtime';
import { _asList, _asTuple, _asMap, _asObject } from './helper';
import { LiveContext, LiveResult } from './runtime';


export default function(run: Runtime<LiveContext, LiveResult>)
{
  const ops = AnyOps;

  // Operations

  run.setOperation(ops.cmp, (params) => (context) => 
    compare(params.value(context), params.test(context))
  );

  run.setOperation(ops.copy, (params) => (context) =>
    copy(params.value(context))
  );

  // Comparisons

  run.setOperation(ops.isValid, (params) => (context) => 
    true
  );

  run.setOperation(ops.isEqual, (params) => (context) => 
    compare(params.value(context), params.test(context)) === 0
  );

  run.setOperation(ops.isNotEqual, (params) => (context) => 
    compare(params.value(context), params.test(context)) !== 0
  );

  run.setOperation(ops.isLess, (params) => (context) => 
    compare(params.value(context), params.test(context)) < 0
  );

  run.setOperation(ops.isLessOrEqual, (params) => (context) => 
    compare(params.value(context), params.test(context)) <= 0
  );

  run.setOperation(ops.isGreater, (params) => (context) => 
    compare(params.value(context), params.test(context)) > 0
  );

  run.setOperation(ops.isGreaterOrEqual, (params) => (context) => 
    compare(params.value(context), params.test(context)) >= 0
  );

  // Casts

  run.setOperation(ops.asAny, (params) => (context) =>
    params.value(context)
  );

  run.setOperation(ops.asBoolean, (params) => (context) =>
    !!params.value(context)
  );

  run.setOperation(ops.asDate, (params) => (context) =>
    parse(params.value(context)) || new Date()
  );

  run.setOperation(ops.asList, (params) => (context) =>
    _asList(params.value, context)
  );

  run.setOperation(ops.asMap, (params) => (context) => 
    _asMap(params.value, context)
  );

  run.setOperation(ops.asNumber, (params) => (context) => {
    const value = parseFloat(params.value(context));

    return isFinite(value) ? value : 0;
  });

  run.setOperation(ops.asObject, (params) => (context) => 
    _asObject(params.value, context)
  );

  run.setOperation(ops.asText, (params) => (context) => 
    toString(params.value(context))
  );

  run.setOperation(ops.asTuple, (params) => (context) => 
    _asTuple(params.value, context)
  );

};