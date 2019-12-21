import { Runtime, SetOps, getCompare, isSet, isBoolean, isDate, isNumber, isObject, isString, isArray, isColor, COMPONENT_MAX } from 'expangine-runtime';
import { saveScope, restoreScope, _set, _optional, _number, _setMaybe } from './helper';
import { LiveCommand, LiveContext, LiveResult } from './LiveRuntime';


// tslint:disable: no-magic-numbers
// tslint:disable: one-variable-per-declaration


export default function(run: Runtime<LiveContext, LiveResult>)
{
  const ops = SetOps;
    
  // Static

  run.setOperation(ops.create, (params) => (context) =>
    new Set()
  );

  // Operations

  run.setOperation(ops.maybe, (params) => (context) => 
    _setMaybe(params.value, context)
  );

  run.setOperation(ops.add, (params, scope) => (context) =>
    _set(params.set, context).add(params.value(context))
  );

  run.setOperation(ops.has, (params) => (context) =>
    _set(params.set, context).has(params.value(context))
  );

  run.setOperation(ops.delete, (params) => (context) =>
    _set(params.set, context).delete(params.value(context))
  );

  run.setOperation(ops.values, (params) => (context) =>
    Array.from(_set(params.set, context).values())
  );

  run.setOperation(ops.clear, (params) => (context) => {
    const set = _set(params.set, context);
    set.clear();

    return set;
  });

  run.setOperation(ops.count, (params) => (context) =>
    _set(params.set, context).size
  );

  run.setOperation(ops.cmp, (params, scope) => (context => {
    const set = _set(params.value, context);
    const test = _set(params.test, context);

    return handleSet(set, context, scope, () => {
      let less = 0, more = 0;

      for (const value of set.values()) {
        if (!test.has(value)) {
          more++;
        }
      }

      for (const value of test.values()) {
        if (!set.has(value)) {
          less++;
        }
      }

      return getCompare(less, more);
    });
  }));

  run.setOperation(ops.copy, (params, scope) => (context) => {
    const set = _set(params.set, context);
    
    if (!params.deepCopy) {
      return new Set(set);
    }
    const valuesCopy: any[] = [];
    handleSet(set, context, scope, () => {  
      for (const value of set) {
        context[scope.value] = value;
        context[scope.set] = set;

        valuesCopy.push(_optional(params.deepCopy, context, value));
      }
    });

    return new Set(valuesCopy);
  });

  run.setOperation(ops.map, (params, scope) => (context) => {
    const set = _set(params.set, context);
    
    if (!params.transform) {
      return new Set(set);
    }
    const valuesTransformed: any[] = [];
    handleSet(set, context, scope, () => {  
      for (const value of set) {
        context[scope.value] = value;
        context[scope.set] = set;

        valuesTransformed.push(_optional(params.transform, context, value));
      }
    });

    return new Set(valuesTransformed);
  });

  // Comparisons

  run.setOperation(ops.isValid, (params) => (context) => 
    isSet(params.value(context))
  );

  run.setOperation(ops.isEqual, (params, scope) => (context) => {
    const set = _set(params.value, context);
    const test = _set(params.test, context);

    if (set.size !== test.size) {
      return false;
    }

    return handleSet(set, context, scope, () => {
      for (const value of set) {
        if (!test.has(value)) {
          return false;
        }
      }

      return true;
    });
  });

  run.setOperation(ops.isNotEqual, (params, scope) => (context) =>
    !run.getOperation(ops.isEqual.id)(params, scope)(context)
  );

  run.setOperation(ops.isLess, (params, scope) => (context) =>
    run.getOperation(ops.cmp.id)(params, scope)(context) < 0
  );

  run.setOperation(ops.isLessOrEqual, (params, scope) => (context) =>
    run.getOperation(ops.cmp.id)(params, scope)(context) <= 0
  );

  run.setOperation(ops.isGreater, (params, scope) => (context) =>
    run.getOperation(ops.cmp.id)(params, scope)(context) > 0
  );

  run.setOperation(ops.isGreaterOrEqual, (params, scope) => (context) =>
    run.getOperation(ops.cmp.id)(params, scope)(context) >= 0
  );

  // Casts

  run.setOperation(ops.asAny, (params) => (context) =>
    params.value(context)
  );

  run.setOperation(ops.asBoolean, (params) => (context) =>
    tryCastValue(params.value, context, isBoolean, (v) => v.size > 0)
  );

  run.setOperation(ops.asDate, (params) => (context) =>
    tryCastValue(params.value, context, isDate, (v) => new Date())
  );

  run.setOperation(ops.asColor, (params) => (context) =>
    tryCastValue(params.value, context, isColor, () =>  ({ r: COMPONENT_MAX, g: COMPONENT_MAX, b: COMPONENT_MAX, a: COMPONENT_MAX }))
  );

  run.setOperation(ops.asList, (params) => (context) => 
    Array.from(_set(params.value, context).values())
  );

  run.setOperation(ops.asMap, (params) => (context) => 
    new Map(Array.from(_set(params.value, context)).map((v) => [v, v]))
  );

  run.setOperation(ops.asNumber, (params) => (context) => 
    tryCastValue(params.value, context, isNumber, (v) => v.size)
  );

  run.setOperation(ops.asObject, (params) => (context) => 
    tryCastValue(params.value, context, isObject, (value) => ({ value }))
  );

  run.setOperation(ops.asText, (params) => (context) => 
    tryCastValue(params.value, context, isString, (v) => '')
  );

  run.setOperation(ops.asTuple, (params) => (context) => 
    tryCastValue(params.value, context, isArray, (v) => [v])
  );

  run.setOperation(ops.asSet, (params) => (context) => 
    params.value(context)
  );

}


function tryCastValue(value: LiveCommand, context: LiveContext, isType: (value: any) => boolean, otherwise: (value: any) => any)
{
  const val = value(context);

  if (!isSet(val) || val.size === 0) 
  {
    return otherwise(val);
  }

  const iterator = val[Symbol.iterator]();

  for (const item of iterator)
  {
    if (isType(item))
    {
      return item;
    }
  }

  return otherwise(val);
}

function handleSet<R>(map: Set<any>, context: LiveContext, scope: Record<string, string>, handle: (map: Set<any>) => R): R
{
  const saved = saveScope(context, scope);
  
  const result = handle(map);

  restoreScope(context, saved);

  return result;
}