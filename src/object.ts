import { Runtime, ObjectOps, compare, copy, toString, isEmpty, isObject, isBoolean, isDate, isArray, isMap, isNumber, isString } from 'expangine-runtime';
import { _object, restoreScope, saveScope } from './helper';
import { LiveContext, LiveResult, LiveCommand } from './LiveRuntime';


export default function(run: Runtime<LiveContext, LiveResult>)
{
  const ops = ObjectOps;

  // Static 

  run.setOperation(ops.create, (params) => (context) =>
    Object.create(null)
  );

  // Operations

  run.setOperation(ops.has, (params) => (context) =>
    params.key(context) in _object(params.object, context)
  );

  run.setOperation(ops.get, (params) => (context) =>
    _object(params.object, context)[params.key(context)]
  );

  run.setOperation(ops.set, (params, scope) => (context) => {
    const object = _object(params.object, context);
    const key = params.key(context);
    const saved = saveScope(context, scope);

    context[scope.existingValue] = object[key];

    const value = params.value(context);

    object[key] = value;

    restoreScope(context, saved);

    return object;
  });

  run.setOperation(ops.delete, (params) => (context) => {
    const object = _object(params.object, context);
    const key = params.key(context);
    const value = object[key];

    delete object[key];

    return value;
  });

  run.setOperation(ops.cmp, (params) => (context) => 
    compare(_object(params.value, context), _object(params.test, context))
  );

  run.setOperation(ops.copy, (params) => (context) =>
    copy(_object(params.object, context))
  );

  // Comparisons

  run.setOperation(ops.isValid, (params) => (context) => 
    isObject(params.value(context))
  );

  run.setOperation(ops.isEqual, (params) => (context) => 
    compare(_object(params.value, context), _object(params.test, context)) === 0
  );

  run.setOperation(ops.isNotEqual, (params) => (context) => 
    compare(_object(params.value, context), _object(params.test, context)) !== 0
  );

  run.setOperation(ops.isLess, (params) => (context) => 
    compare(_object(params.value, context), _object(params.test, context)) < 0
  );

  run.setOperation(ops.isLessOrEqual, (params) => (context) => 
    compare(_object(params.value, context), _object(params.test, context)) <= 0
  );

  run.setOperation(ops.isGreater, (params) => (context) => 
    compare(_object(params.value, context), _object(params.test, context)) > 0
  );

  run.setOperation(ops.isGreaterOrEqual, (params) => (context) => 
    compare(_object(params.value, context), _object(params.test, context)) >= 0
  );

  // Casts

  run.setOperation(ops.asAny, (params) => (context) =>
    params.value(context)
  );

  run.setOperation(ops.asBoolean, (params) => (context) =>
    tryCastValue(params.value, context, isBoolean, () => true)
  );

  run.setOperation(ops.asDate, (params) => (context) =>
    tryCastValue(params.value, context, isDate, () => new Date())
  );

  run.setOperation(ops.asList, (params) => (context) => 
    tryCastValue(params.value, context, isArray, v => isEmpty(v) ? [] : [v])
  );

  run.setOperation(ops.asMap, (params) => (context) => 
    tryCastValue(params.value, context, isMap, v => isEmpty(v) ? new Map() : new Map([['value', v]]))
  );

  run.setOperation(ops.asNumber, (params) => (context) => 
    tryCastValue(params.value, context, isNumber, () => 0)
  );

  run.setOperation(ops.asObject, (params) => (context) => 
    params.value(context)
  );

  run.setOperation(ops.asText, (params) => (context) => 
    tryCastValue(params.value, context, isString, v => toString(v))
  );

  run.setOperation(ops.asTuple, (params) => (context) => 
    tryCastValue(params.value, context, isArray, v => [v])
  );

}

function tryCastValue(value: LiveCommand, context: LiveContext, isType: (value: any) => boolean, otherwise: (value: any) => any)
{
  const val = value(context);

  return isObject(val) && isType(val.value)
    ? val.value
    : otherwise(val);
}