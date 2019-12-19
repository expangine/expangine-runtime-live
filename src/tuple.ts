import { Runtime, TupleOps, compare, copy, isBoolean, isDate, isEmpty, isNumber, isString, isArray, isMap, isObject, isColor, COMPONENT_MAX } from 'expangine-runtime';
import { _list, _number, _listMaybe, _optional, _asSet } from './helper';
import { LiveContext, LiveResult, LiveCommand } from './LiveRuntime';


export default function(run: Runtime<LiveContext, LiveResult>)
{
  const ops = TupleOps;

  // Statics

  run.setOperation(ops.create, (params) => (context) =>
    []
  );

  // Operations

  run.setOperation(ops.maybe, (params) => (context) => 
    _listMaybe(params.value, context)
  );

  run.setOperation(ops.cmp, (params) => (context) => 
    compare(params.value(context), params.test(context))
  );

  run.setOperation(ops.copy, (params) => (context) =>
    copy(params.value(context))
  );

  function buildValues(built: any[], values: any)
  {
    if (isArray(values))
    {
      built.push(...values);
    }
    else
    {
      built.push(values);
    }
  }

  run.setOperation(ops.build, (params) => (context) => {
    const built: any[] = [];

    buildValues(built, params.a(context));
    buildValues(built, params.b(context));
    buildValues(built, _optional(params.c, context));
    buildValues(built, _optional(params.d, context));
    buildValues(built, _optional(params.e, context));

    return built;
  });

  run.setOperation(ops.get, (params) => (context) =>
    _list(params.value, context)[_number(params.index, context, 0)]
  );

  run.setOperation(ops.set, (params) => (context) => {
    const tuple = _list(params.value, context);
    const index = _number(params.index, context, 0);
    const existing = tuple[index];
    tuple[index] = params.element(context);
    
    return existing;
  });

  // Comparisons

  run.setOperation(ops.isValid, (params) => (context) => 
    isArray(params.value(context))
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
    tryCastValue(params.value, context, isBoolean, (v) => v.find ? v.find(isBoolean) || false : false)
  );

  run.setOperation(ops.asColor, (params) => (context) =>
    tryCastValue(params.value, context, isColor, () =>  ({ r: COMPONENT_MAX, g: COMPONENT_MAX, b: COMPONENT_MAX, a: COMPONENT_MAX }))
  );

  run.setOperation(ops.asDate, (params) => (context) =>
    tryCastValue(params.value, context, isDate, (v) => v.find ? v.find(isDate) || new Date() : new Date())
  );

  run.setOperation(ops.asList, (params) => (context) => 
    tryCastValue(params.value, context, isArray, (v) => isEmpty(v) ? [] : [v])
  );

  run.setOperation(ops.asMap, (params) => (context) => 
    tryCastValue(params.value, context, isMap, (v) => isEmpty(v) ? new Map() : new Map([['value', v]]))
  );

  run.setOperation(ops.asNumber, (params) => (context) => 
    tryCastValue(params.value, context, isNumber, (v) => v.find ? v.find(isNumber) || 0 : 0)
  );

  run.setOperation(ops.asObject, (params) => (context) => 
    tryCastValue(params.value, context, isObject, (value) => ({ value }))
  );

  run.setOperation(ops.asText, (params) => (context) => 
    tryCastValue(params.value, context, isString, (v) => v.find ? v.find(isString) || '' : '')
  );

  run.setOperation(ops.asTuple, (params) => (context) => 
    params.value(context)
  );

  run.setOperation(ops.asSet, (params) => (context) => 
    _asSet(params.value, context)
  );

}

function tryCastValue(value: LiveCommand, context: LiveContext, isType: (value: any) => boolean, otherwise: (value: any) => any)
{
  const val = value(context);

  return isArray(val) && isType(val[0])
    ? val[0]
    : otherwise(val);
}