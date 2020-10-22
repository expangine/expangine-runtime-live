import { ColorOps, COMPONENT_MAX, Color, clampComponent, ColorType, ColorSpaceHSL, ColorNames, isColor, ColorSpaceRGB } from 'expangine-runtime';
import { _color, _colorMaybe, _number, _colorOrNumber, _bool, _text, _object, _asList, _asMap, _asTuple, _asSet } from './helper';
import { LiveRuntimeImpl } from './LiveRuntime';


// tslint:disable: no-magic-numbers
// tslint:disable: no-bitwise

export default function(run: LiveRuntimeImpl)
{
  const ops = ColorOps;

  // Static 

  run.setOperation(ops.create, () => () =>
    ({ r: COMPONENT_MAX, g: COMPONENT_MAX, b: COMPONENT_MAX, a: COMPONENT_MAX })
  );

  // Operations

  run.setOperation(ops.maybe, (params) => (context) => 
    _colorMaybe(params.value, context)
  );

  run.setOperation(ops.cmp, (params) => (context) => 
    compareColor(_color(params.value, context), _color(params.test, context), 0)
  );

  run.setOperation(ops.copy, (params) => (context) => 
    ({ ..._color(params.value, context) })
  );

  run.setOperation(ops.build, (params) => (context) => ({
    r: _number(params.r, context, COMPONENT_MAX),
    g: _number(params.g, context, COMPONENT_MAX),
    b: _number(params.b, context, COMPONENT_MAX),
    a: _number(params.a, context, COMPONENT_MAX),
  }));

  run.setOperation(ops.map, (params, scope) => (context) => {
    const value = _color(params.value, context);

    return run.enterScope(context, [scope.value, scope.component], (inner) => {

      run.dataSet(inner, scope.value, value.r);
      run.dataSet(inner, scope.component, 'r');
      const r = _number(params.r, inner, COMPONENT_MAX);

      run.dataSet(inner, scope.value, value.g);
      run.dataSet(inner, scope.component, 'g');
      const g = _number(params.g, inner, COMPONENT_MAX);

      run.dataSet(inner, scope.value, value.b);
      run.dataSet(inner, scope.component, 'b');
      const b = _number(params.b, inner, COMPONENT_MAX);

      run.dataSet(inner, scope.value, value.a);
      run.dataSet(inner, scope.component, 'a');
      const a = _number(params.a, inner, COMPONENT_MAX);

      return { r, g, b, a };
    });
  });

  run.setOperation(ops.op, (params, scope) => (context) => {
    const value = _color(params.value, context);
    const test = _color(params.test, context);

    return run.enterScope(context, [scope.value, scope.test, scope.component], (inner) => {

      run.dataSet(inner, scope.value, value.r);
      run.dataSet(inner, scope.test, test.r);
      run.dataSet(inner, scope.component, 'r');
      const r = _number(params.r, inner, COMPONENT_MAX);

      run.dataSet(inner, scope.value, value.g);
      run.dataSet(inner, scope.test, test.g);
      run.dataSet(inner, scope.component, 'g');
      const g = _number(params.g, inner, COMPONENT_MAX);

      run.dataSet(inner, scope.value, value.b);
      run.dataSet(inner, scope.test, test.b);
      run.dataSet(inner, scope.component, 'b');
      const b = _number(params.b, inner, COMPONENT_MAX);

      run.dataSet(inner, scope.value, value.a);
      run.dataSet(inner, scope.test, test.a);
      run.dataSet(inner, scope.component, 'a');
      const a = _number(params.a, inner, COMPONENT_MAX);

      return { r, g, b, a };
    });
  });

  run.setOperation(ops.clamp, (params) => (context) => {
    const value = _color(params.value, context);
    
    return {
      r: clampComponent(value.r),
      g: clampComponent(value.g),
      b: clampComponent(value.b),
      a: clampComponent(value.a),
    };
  });

  run.setOperation(ops.add, (params) => (context) => {
    const value = _color(params.value, context);
    const addend = _colorOrNumber(params.addend, context);
    const alpha = _bool(params.alpha, context, true);
    
    return {
      r: value.r + addend.r,
      g: value.g + addend.g,
      b: value.b + addend.b,
      a: alpha ? value.a + addend.a : value.a,
    };
  });

  run.setOperation(ops.adds, (params) => (context) => {
    const value = _color(params.value, context);
    const addend = _colorOrNumber(params.addend, context);
    const scale = _colorOrNumber(params.addendScale, context);
    const alpha = _bool(params.alpha, context, true);
    
    return {
      r: value.r + addend.r * scale.r,
      g: value.g + addend.g * scale.g,
      b: value.b + addend.b * scale.b,
      a: alpha ? value.a + addend.a * scale.a : value.a,
    };
  });

  run.setOperation(ops.sub, (params) => (context) => {
    const value = _color(params.value, context);
    const subtrahend = _colorOrNumber(params.subtrahend, context);
    const alpha = _bool(params.alpha, context, true);
    
    return {
      r: value.r - subtrahend.r,
      g: value.g - subtrahend.g,
      b: value.b - subtrahend.b,
      a: alpha ? value.a - subtrahend.a : value.a,
    };
  });

  run.setOperation(ops.mul, (params) => (context) => {
    const value = _color(params.value, context);
    const multiplier = _colorOrNumber(params.multiplier, context);
    const alpha = _bool(params.alpha, context, true);
    
    return {
      r: value.r * multiplier.r,
      g: value.g * multiplier.g,
      b: value.b * multiplier.b,
      a: alpha ? value.a * multiplier.a : value.a,
    };
  });

  run.setOperation(ops.div, (params) => (context) => {
    const value = _color(params.value, context);
    const divisor = _colorOrNumber(params.divisor, context);
    const alpha = _bool(params.alpha, context, true);
    
    return {
      r: divSafe(value.r, divisor.r),
      g: divSafe(value.g, divisor.g),
      b: divSafe(value.b, divisor.b),
      a: alpha ? divSafe(value.a, divisor.a) : value.a,
    };
  });

  run.setOperation(ops.mod, (params) => (context) => {
    const value = _color(params.value, context);
    const divisor = _colorOrNumber(params.divisor, context);
    const alpha = _bool(params.alpha, context, true);
    
    return {
      r: value.r % divisor.r,
      g: value.g % divisor.g,
      b: value.b % divisor.b,
      a: alpha ? value.a % divisor.a : value.a,
    };
  });

  run.setOperation(ops.format, (params) => (context) => {
    const value = _color(params.value, context);
    const formatId = _text(params.format, context);
    const format = ColorType.getFormat(formatId);

    if (!format) {
      return '';
    }

    return format.formatter(value);
  });

  run.setOperation(ops.parse, (params) => (context) => {
    const value = params.value(context);
    
    return ColorType.baseType.normalize(value);
  });

  run.setOperation(ops.lerp, (params) => (context) => {
    const start = _color(params.start, context);
    const end = _color(params.end, context);
    const delta = _number(params.delta, context, 0);

    return {
      r: (end.r - start.r) * delta + start.r,
      g: (end.g - start.g) * delta + start.g,
      b: (end.b - start.b) * delta + start.b,
      a: (end.a - start.a) * delta + start.a,
    };
  });

  run.setOperation(ops.lighten, (params) => (context) => {
    const value = _color(params.value, context);
    const amount = _number(params.amount, context, 0);

    return {
      r: value.r + (COMPONENT_MAX - value.r) * amount,
      g: value.g + (COMPONENT_MAX - value.g) * amount,
      b: value.b + (COMPONENT_MAX - value.b) * amount,
      a: value.a + (COMPONENT_MAX - value.a) * amount,
    };
  });

  run.setOperation(ops.darken, (params) => (context) => {
    const value = _color(params.value, context);
    const amount = 1 - _number(params.amount, context, 0);

    return {
      r: value.r * amount,
      g: value.g * amount,
      b: value.b * amount,
      a: value.a * amount,
    };
  });

  run.setOperation(ops.toHSL, (params) => (context) =>
    ColorSpaceHSL.fromColor(_color(params.value, context))
  );

  run.setOperation(ops.fromHSL, (params) => (context) =>
    ColorSpaceHSL.toColor(_object(params.value, context))
  );

  run.setOperation(ops.luminance, (params) => (context) => {
    const value = _color(params.value, context);
    const L = value.r * 0.2126 + value.g * 0.7152 + value.b * 0.0722;

    return L / COMPONENT_MAX;
  });

  run.setOperation(ops.contrast, (params) => (context) => {
    const value = _color(params.value, context);
    const test = _color(params.test, context);
    const valueL = value.r * 0.2126 + value.g * 0.7152 + value.b * 0.0722; 
    const testL = test.r * 0.2126 + test.g * 0.7152 + test.b * 0.0722;
    const L1 = Math.max(valueL, testL);
    const L2 = Math.min(valueL, testL);

    return (L1 + 0.05) / (L2 + 0.05);
  });

  run.setOperation(ops.invert, (params) => (context) => {
    const value = _color(params.value, context);
    const alpha = _bool(params.alpha, context, false);

    return {
      r: COMPONENT_MAX - value.r,
      g: COMPONENT_MAX - value.g,
      b: COMPONENT_MAX - value.b,
      a: alpha ? COMPONENT_MAX - value.a : value.a,
    };
  });

  run.setOperation(ops.opaque, (params) => (context) => {
    const { r, g, b } = _color(params.value, context);
    const a = COMPONENT_MAX;

    return { r, g, b, a };
  });

  run.setOperation(ops.alpha, (params) => (context) => {
    const { r, g, b } = _color(params.value, context);
    const a = _number(params.alpha, context, COMPONENT_MAX);

    return { r, g, b, a };
  });

  run.setOperation(ops.distance, (params) => (context) => {
    const value = _color(params.value, context);
    const test = _color(params.test, context);
    
    return dist(value, test);
  });

  run.setOperation(ops.named, (params) => (context) => {
    const value = _color(params.name, context);

    return {
      r: value.r,
      g: value.g,
      b: value.b,
      a: value.a,
    };
  });

  run.setOperation(ops.getName, (params) => (context) => {
    const value = _color(params.value, context);
    let closestName: string = '';
    let closestDistance: number = -1;

    for (const [name, named] of ColorNames.options.constants.entries()) {
      const distance = dist(value, named);
      if (closestDistance === -1 || distance < closestDistance) {
        closestName = name;
        closestDistance = distance;
      }
    }

    return closestName;
  });

  run.setOperation(ops.blend, (params) => (context) => {
    const top = _color(params.top, context);
    const bottom = _color(params.bottom, context);
    const modeName = params.mode(context);
    const blender = BlendFunctions[modeName];

    if (!blender) {
      return top;
    }

    return {
      r: blender(bottom.r, top.r),
      g: blender(bottom.g, top.g),
      b: blender(bottom.b, top.b),
      a: top.a,
    };
  });

  // Comparisons

  run.setOperation(ops.isValid, (params) => (context) => 
    isColor(params.value(context))
  );

  run.setOperation(ops.isEqual, (params) => (context) => 
    compareColor(_color(params.value, context), _color(params.test, context), _number(params.epsilon, context, 0)) === 0
  );

  run.setOperation(ops.isNotEqual, (params) => (context) => 
    compareColor(_color(params.value, context), _color(params.test, context), _number(params.epsilon, context, 0)) !== 0
  );

  run.setOperation(ops.isLess, (params) => (context) => 
    compareColor(_color(params.value, context), _color(params.test, context), 0) < 0
  );

  run.setOperation(ops.isLessOrEqual, (params) => (context) => 
    compareColor(_color(params.value, context), _color(params.test, context), 0) <= 0
  );

  run.setOperation(ops.isGreater, (params) => (context) => 
    compareColor(_color(params.value, context), _color(params.test, context), 0) > 0
  );

  run.setOperation(ops.isGreaterOrEqual, (params) => (context) => 
    compareColor(_color(params.value, context), _color(params.test, context), 0) >= 0
  );

  // Casts

  run.setOperation(ops.asAny, (params) => (context) =>
    params.value(context)
  );

  run.setOperation(ops.asBoolean, () => () =>
    true
  );

  run.setOperation(ops.asColor, (params) => (context) =>
    params.value(context)
  );

  run.setOperation(ops.asDate, () => () =>
    new Date()
  );

  run.setOperation(ops.asList, (params) => (context) => 
    _asList(params.value, context)
  );

  run.setOperation(ops.asMap, (params) => (context) => 
    _asMap(params.value, context)
  );

  run.setOperation(ops.asNumber, (params) => (context) => {
    const value = _color(params.value, context);

    return (value.r & 0xFF) | 
      ((value.g & 0xFF) << 8) |
      ((value.b & 0xFF) << 16) |
      ((value.a & 0xFF) << 24);
  })

  run.setOperation(ops.asObject, (params) => (context) => 
    params.value(context)
  );

  run.setOperation(ops.asText, (params) => (context) => 
    ColorSpaceRGB.formatMap.bestfit.formatter(_color(params.value, context))
  );

  run.setOperation(ops.asTuple, (params) => (context) => 
    _asTuple(params.value, context)
  );

  run.setOperation(ops.asSet, (params) => (context) => 
    _asSet(params.value, context)
  );

}

function compareColor(x: Color, y: Color, epsilon: number): number
{
  const r = Math.abs(x.r - y.r) <= epsilon;
  const g = Math.abs(x.g - y.g) <= epsilon;
  const b = Math.abs(x.b - y.b) <= epsilon;
  const a = Math.abs(x.a - y.a) <= epsilon;

  return r && g && b && a
    ? 0
    : (x.r + x.g + x.b + x.a) - (y.r + y.g + y.b + y.a);
}

function divSafe(a: number, b: number): number
{
  return b === 0 ? 0 : a / b;
}

function dist(a: Color, b: Color): number
{
  return Math.abs(a.r - b.r) + 
    Math.abs(a.g - b.g) + 
    Math.abs(a.b - b.b) + 
    Math.abs(a.a - b.a);
}

function mul(a: number, b: number): number
{
  return (a * b + COMPONENT_MAX) >> 8;
}

function div(a: number, b: number): number
{
  return b === 0 ? 0 : ((a << 8) - a) / b;
}

function inv(a: number): number
{
  return COMPONENT_MAX - a;
}

const BlendFunctions: Record<string, (a: number, b: number) => number> = {
  multiply:   (a, b) => mul(a, b),
  screen:     (a, b) => inv(mul(inv(a), inv(b))),
  overlay:    (a, b) => a < 127 ? 2 * mul(a, b) : inv(2 * mul(inv(a), inv(b))),
  hard:       (a, b) => b < 127 ? 2 * mul(a, b) : inv(2 * mul(inv(a), inv(b))),
  soft:       (a, b) => mul(inv(2 * b), mul(a, a)) + 2 * mul(b, a),
  dodge:      (a, b) => div(a, inv(b)),
  burn:       (a, b) => div(inv(b), a),
  divide:     (a, b) => a === b ? COMPONENT_MAX : div(a, b),
  addition:   (a, b) => clampComponent(a + b),
  sub:        (a, b) => clampComponent(a - b),
  diff:       (a, b) => clampComponent(b - a),
  darken:     (a, b) => Math.min(a, b),
  lighten:    (a, b) => Math.max(a, b),
};