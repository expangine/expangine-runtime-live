import { AnyOps, parse, DataTypes, toString, ColorType, COMPONENT_MAX } from 'expangine-runtime';
import { _asList, _asTuple, _asMap, _asObject, _asSet } from './helper';
import { LiveRuntimeImpl } from './LiveRuntime';


export default function(run: LiveRuntimeImpl)
{
  const ops = AnyOps;

  // Operations

  run.setOperation(ops.cmp, (params) => (context) => 
    DataTypes.compare(params.value(context), params.test(context))
  );

  run.setOperation(ops.copy, (params) => (context) =>
    DataTypes.copy(params.value(context))
  );

  run.setOperation(ops.isDefined, (params) => (context) => {
    const value = params.value(context);
    
    return value !== null && value !== undefined;
  });

  run.setOperation(ops.getDefined, (params, scope) => (context) => {
    const value = params.value(context);
    const isDefined = value !== null && value !== undefined;
  
    if (isDefined) {
      run.enterScope(context, [scope.defined], (inner) => {
        run.dataSet(inner, scope.defined, value);
        params.defined(inner);
      });
    }

    return isDefined;
  });

  run.setOperation(ops.coalesce, (params) => (context) => {
    const a = params.a(context);
    if (a !== null && a !== undefined) return a;
    const b = params.b(context);
    if (b !== null && b !== undefined) return b;
    const c = params.c(context);
    if (c !== null && c !== undefined) return c;
    const d = params.d(context);
    if (d !== null && d !== undefined) return d;
    const e = params.e(context);
    if (e !== null && e !== undefined) return e;
  });

  run.setOperation(ops.require, (params) => (context) => {
    const value = params.value(context);
    if (value === null || value === undefined) {
      throw new Error('A value being required was not defined.' + params);
    }

    return value;
  });

  run.setOperation(ops.ternary, (params) => (context) => 
    params.condition(context) ? params.truthy(context) : params.falsy(context)
  );

  // Comparisons

  run.setOperation(ops.isValid, (params) => (context) => 
    true
  );

  run.setOperation(ops.isEqual, (params) => (context) => 
    DataTypes.equals(params.value(context), params.test(context))
  );

  run.setOperation(ops.isNotEqual, (params) => (context) => 
    !DataTypes.equals(params.value(context), params.test(context))
  );

  run.setOperation(ops.isLess, (params) => (context) => 
    DataTypes.compare(params.value(context), params.test(context)) < 0
  );

  run.setOperation(ops.isLessOrEqual, (params) => (context) => 
    DataTypes.compare(params.value(context), params.test(context)) <= 0
  );

  run.setOperation(ops.isGreater, (params) => (context) => 
    DataTypes.compare(params.value(context), params.test(context)) > 0
  );

  run.setOperation(ops.isGreaterOrEqual, (params) => (context) => 
    DataTypes.compare(params.value(context), params.test(context)) >= 0
  );

  // Casts

  run.setOperation(ops.asAny, (params) => (context) =>
    params.value(context)
  );

  run.setOperation(ops.asBoolean, (params) => (context) =>
    !!params.value(context)
  );

  run.setOperation(ops.asColor, (params) => (context) =>
    ColorType.baseType.normalize(params.value(context)) || { r: COMPONENT_MAX, g: COMPONENT_MAX, b: COMPONENT_MAX, a: COMPONENT_MAX }
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

  run.setOperation(ops.asSet, (params) => (context) => 
    _asSet(params.value, context)
  );

};