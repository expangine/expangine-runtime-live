import { Runtime, MapOps, toArray, getCompare, isMap, isBoolean, isDate, isNumber, isObject, isString, isArray } from 'expangine-runtime';
import { saveScope, restoreScope, _map, _optional, _number } from './helper';
import { LiveCommand, LiveContext, LiveResult } from './LiveRuntime';


// tslint:disable: no-magic-numbers
// tslint:disable: one-variable-per-declaration


export default function(run: Runtime<LiveContext, LiveResult>)
{
  const ops = MapOps;
    
  // Static

  run.setOperation(ops.create, (params) => (context) =>
    new Map()
  );

  // Operations

  run.setOperation(ops.get, (params) => (context) => 
    _map(params.map, context).get(params.key(context))
  );

  run.setOperation(ops.set, (params, scope) => (context) => {
    const map = _map(params.map, context);
    const key = params.key(context);
    const existing = map.get(key);
    const saved = saveScope(context, scope);

    context[scope.existingValue] = existing;

    const value = params.value(context);

    map.set(key, value);

    restoreScope(context, saved);

    return existing;
  });

  run.setOperation(ops.has, (params) => (context) =>
    _map(params.map, context).has(params.key(context))
  );

  run.setOperation(ops.delete, (params) => (context) =>
    _map(params.map, context).delete(params.key(context))
  );

  run.setOperation(ops.keys, (params) => (context) =>
    toArray(_map(params.map, context).keys())
  );

  run.setOperation(ops.values, (params) => (context) =>
    toArray(_map(params.map, context).values())
  );

  run.setOperation(ops.entries, (params) => (context) => {
    const map = _map(params.map, context);
    const entries: { keys: any[], values: any[] } = { keys: [], values: [] };

    for (const [key, value] of map.entries()) {
      entries.keys.push(key);
      entries.values.push(value);
    }

    return entries;
  });

  run.setOperation(ops.pairs, (params) => (context) => {
    const map = _map(params.map, context);
    const pairs: Array<{ key: any, value: any }> = [];

    for (const [key, value] of map.entries()) {
      pairs.push({ key, value });
    }

    return pairs;
  });

  run.setOperation(ops.clear, (params) => (context) => {
    const map = _map(params.map, context);
    map.clear();

    return map;
  });

  run.setOperation(ops.count, (params) => (context) =>
    _map(params.map, context).size
  );

  run.setOperation(ops.cmp, (params, scope) => (context => {
    const map = _map(params.value, context);
    const test = _map(params.test, context);

    return handleMap(map, context, scope, () => {
      let less = 0, more = 0;

      for (const [key, value] of map.entries()) {
        if (!test.has(key)) {
          more++;
          continue;
        }

        context[scope.key] = key;
        context[scope.value] = value;
        context[scope.test] = test.get(key);

        const d = _number(params.compare, context, 0);

        if (d < 0) less++;
        else if (d > 0) more++;
      }

      for (const key of test.keys()) {
        if (!map.has(key)) {
          less++;
        }
      }

      return getCompare(less, more);
    });
  }));

  run.setOperation(ops.copy, (params, scope) => (context) => {
    const map = _map(params.map, context);
    const entries = map.entries();

    if (!params.deepCopy && !params.deepCopyKey) {
      return new Map(toArray(entries));
    }
    const entriesCopy: [any, any][] = [];
    handleMap(map, context, scope, () => {  
      for (const [key, value] of entries) {
        context[scope.key] = key;
        context[scope.value] = value;
        context[scope.map] = map;

        entriesCopy.push([
          _optional(params.deepCopyKey, context, key),
          _optional(params.deepCopy, context, value)
        ]);
      }
    });

    return new Map(entriesCopy);
  });

  run.setOperation(ops.map, (params, scope) => (context) => {
    const map = _map(params.map, context);
    const entries = map.entries();

    if (!params.transform && !params.transformKey) {
      return new Map(toArray(entries));
    }
    const entriesTransformed: [any, any][] = [];
    handleMap(map, context, scope, () => {  
      for (const [key, value] of entries) {
        context[scope.key] = key;
        context[scope.value] = value;
        context[scope.map] = map;

        entriesTransformed.push([
          _optional(params.transformKey, context, key),
          _optional(params.transform, context, value)
        ]);
      }
    });

    return new Map(entriesTransformed);
  });

  run.setOperation(ops.toPlainObject, (params) => (context) => {
    const map = _map(params.map, context);
    const plain = Object.create(null);

    for (const [key, value] of map.entries()) {
      plain[key] = value;
    }

    return plain;
  });

  // Comparisons

  run.setOperation(ops.isValid, (params) => (context) => 
    isMap(params.value(context))
  );

  run.setOperation(ops.isEqual, (params, scope) => (context) => {
    const map = _map(params.value, context);
    const test = _map(params.test, context);

    if (map.size !== test.size) {
      return false;
    }

    return handleMap(map, context, scope, () => {
      for (const [key, value] of map.entries()) {
        if (!test.has(key)) {
          return false;
        }

        context[scope.key] = key;
        context[scope.value] = value;
        context[scope.test] = test.get(key);

        if (!params.isEqual(context)) { 
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

  run.setOperation(ops.asList, (params) => (context) => 
    toArray(_map(params.value, context).values())
  );

  run.setOperation(ops.asMap, (params) => (context) => 
    params.value(context)
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

}


function tryCastValue(value: LiveCommand, context: LiveContext, isType: (value: any) => boolean, otherwise: (value: any) => any)
{
  const val = value(context);

  return isMap(val) && isType(val.get('value'))
    ? val.get('value')
    : otherwise(val);
}

function handleMap<R>(map: Map<any, any>, context: LiveContext, scope: Record<string, string>, handle: (map: Map<any, any>) => R): R
{
  const saved = saveScope(context, scope);
  
  const result = handle(map);

  restoreScope(context, saved);

  return result;
}