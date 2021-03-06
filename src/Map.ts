import { MapOps, DataTypes, isMap, isBoolean, isDate, isNumber, isObject, isString, isArray, isColor, COMPONENT_MAX } from 'expangine-runtime';
import { _map, _optional, _number, _mapMaybe, _object } from './helper';
import { LiveCommand, LiveContext, LiveRuntimeImpl } from './LiveRuntime';


// tslint:disable: no-magic-numbers
// tslint:disable: one-variable-per-declaration


export default function(run: LiveRuntimeImpl)
{
  const ops = MapOps;
    
  // Static

  run.setOperation(ops.create, (params) => (context) =>
    new Map()
  );

  run.setOperation(ops.createLike, (params) => (context) =>
    new Map()
  );

  run.setOperation(ops.createFor, (params) => (context) =>
    new Map()
  );

  // Operations

  run.setOperation(ops.maybe, (params) => (context) => 
    _mapMaybe(params.value, context)
  );

  run.setOperation(ops.get, (params) => (context) => 
    _map(params.map, context).get(params.key(context))
  );

  run.setOperation(ops.set, (params, scope) => (context) => {
    const map = _map(params.map, context);
    const key = params.key(context);
    const existing = map.get(key);

    run.enterScope(context, [scope.existingValue], (inner) => {
      run.dataSet(inner, scope.existingValue, existing);

      const value = params.value(inner);

      map.set(key, value);
    });

    return existing;
  });

  run.setOperation(ops.has, (params) => (context) =>
    _map(params.map, context).has(params.key(context))
  );

  run.setOperation(ops.delete, (params) => (context) =>
    _map(params.map, context).delete(params.key(context))
  );

  run.setOperation(ops.keys, (params) => (context) =>
    Array.from(_map(params.map, context).keys())
  );

  run.setOperation(ops.values, (params) => (context) =>
    Array.from(_map(params.map, context).values())
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

    return run.enterScope(context, [scope.value, scope.key, scope.test], (inner) => {
      let less = 0, more = 0;

      for (const [key, value] of map.entries()) {
        if (!test.has(key)) {
          more++;
          continue;
        }

        run.dataSet(inner, scope.key, key);
        run.dataSet(inner, scope.value, value);
        run.dataSet(inner, scope.test, test.get(key));

        const d = _number(params.compare, inner, 0);

        if (d < 0) less++;
        else if (d > 0) more++;
      }

      for (const key of test.keys()) {
        if (!map.has(key)) {
          less++;
        }
      }

      return DataTypes.getCompare(less, more);
    });
  }));

  run.setOperation(ops.copy, (params, scope) => (context) => {
    const map = _map(params.map, context);
    const entries = map.entries();

    if (!params.deepCopy && !params.deepCopyKey) {
      return new Map(entries);
    }
    const entriesCopy: [any, any][] = [];
    run.enterScope(context, [scope.value, scope.key, scope.map], (inner) => {
      for (const [key, value] of entries) {
        run.dataSet(inner, scope.key, key);
        run.dataSet(inner, scope.value, value);
        run.dataSet(inner, scope.map, map);

        entriesCopy.push([
          _optional(params.deepCopyKey, inner, key),
          _optional(params.deepCopy, inner, value)
        ]);
      }
    });

    return new Map(entriesCopy);
  });

  run.setOperation(ops.map, (params, scope) => (context) => {
    const map = _map(params.map, context);
    const entries = map.entries();

    if (!params.transform && !params.transformKey) {
      return new Map(entries);
    }
    const entriesTransformed: [any, any][] = [];
    run.enterScope(context, [scope.value, scope.value, scope.map], (inner) => {
      for (const [key, value] of entries) {
        run.dataSet(inner, scope.key, key);
        run.dataSet(inner, scope.value, value);
        run.dataSet(inner, scope.map, map);

        entriesTransformed.push([
          _optional(params.transformKey, inner, key),
          _optional(params.transform, inner, value)
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

  run.setOperation(ops.fromPlainObject, (params) => (context) => {
    const obj = _object(params.object, context);
    const map = new Map();

    for (const prop in obj) {
      map.set(prop, obj[prop]);
    }

    return map;
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

    return run.enterScope(context, [scope.value, scope.key, scope.test], (inner) => {
      for (const [key, value] of map.entries()) {
        if (!test.has(key)) {
          return false;
        }

        run.dataSet(inner, scope.key, key);
        run.dataSet(inner, scope.value, value);
        run.dataSet(inner, scope.test, test.get(key));

        if (!params.isEqual(inner)) { 
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
    Array.from(_map(params.value, context).values())
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

  run.setOperation(ops.asSet, (params) => (context) => 
    new Set(_map(params.value, context).values())
  );

  function tryCastValue(value: LiveCommand, context: LiveContext, isType: (value: any) => boolean, otherwise: (value: any) => any)
  {
    const val = value(context);
  
    return isMap(val) && isType(val.get('value'))
      ? val.get('value')
      : otherwise(val);
  }

}
