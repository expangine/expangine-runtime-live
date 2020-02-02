import { Runtime, NumberOps, parse, isNumber, isUndefined, isString, isWhole } from 'expangine-runtime';
import { _number, _bool, _text, _numberMaybe, _textMaybe, _asTuple, _asObject, _asMap, _asList, _asSet } from './helper';
import { LiveContext, LiveResult } from './LiveRuntime';


const DEFAULT_BASE = 10;
const SEPARATOR_NUMBER = 1.5;
const SEPARATOR_OFFSET = 3;
const PERCENT_SCALE = 100;

export default function(run: Runtime<LiveContext, LiveResult>, epsilon: number = 0.000001)
{
  const ops = NumberOps;

  // Statics

  run.setOperation(ops.create, (params) => (context) =>
    0
  );

  run.setOperation(ops.pi, (params) => (context) =>
    Math.PI
  );

  run.setOperation(ops.pi2, (params) => (context) =>
    Math.PI + Math.PI
  );

  run.setOperation(ops.piHalf, (params) => (context) =>
    // tslint:disable-next-line: no-magic-numbers
    Math.PI * 0.5
  );

  run.setOperation(ops.e, (params) => (context) =>
    Math.E
  );

  run.setOperation(ops.sqrt2, (params) => (context) =>
    Math.SQRT2
  );

  run.setOperation(ops.sqrt12, (params) => (context) =>
    Math.SQRT1_2
  );

  run.setOperation(ops.ln2, (params) => (context) =>
    Math.LN2
  );

  run.setOperation(ops.ln10, (params) => (context) =>
    Math.LN10
  );

  run.setOperation(ops.log2e, (params) => (context) =>
    Math.LOG2E
  );

  run.setOperation(ops.log10e, (params) => (context) =>
    Math.LOG10E
  );

  // Binary Operations

  run.setOperation(ops.add, (params) => (context) => 
    _number(params.value, context) + _number(params.addend, context)
  );

  run.setOperation(ops.sub, (params) => (context) => 
    _number(params.value, context) - _number(params.subtrahend, context)
  );

  run.setOperation(ops.mul, (params) => (context) => 
    _number(params.value, context) * _number(params.multiplier, context)
  );

  run.setOperation(ops.div, (params) => (context) => 
    _number(params.value, context) / _number(params.divisor, context)
  );

  run.setOperation(ops.mod, (params) => (context) => 
    _number(params.value, context) % _number(params.divisor, context)
  );

  run.setOperation(ops.min, (params) => (context) => 
    Math.min(_number(params.a, context), _number(params.b, context))
  );

  run.setOperation(ops.max, (params) => (context) => 
    Math.max(_number(params.a, context), _number(params.b, context))
  );

  run.setOperation(ops.pow, (params) => (context) => 
    Math.pow(_number(params.value, context), _number(params.exponent, context))
  );

  run.setOperation(ops.atan2, (params) => (context) => 
    Math.atan2(_number(params.y, context), _number(params.x, context))
  );

  run.setOperation(ops.hypot, (params) => (context) => {
    const a = _number(params.a, context);
    const b = _number(params.b, context);

    return Math.sqrt(a * a + b * b);
  });

  run.setOperation(ops.choose, (params) => (context) => {
    const n = _number(params.n, context);
    const k = _number(params.k, context);
    if (!isFinite(n) || !isFinite(k)) {
      return Number.NaN;
    }

    return choose(n, k);
  });

  run.setOperation(ops.gcd, (params) => (context) => {
    const a = _number(params.a, context);
    const b = _number(params.b, context);
    if (!isFinite(a) || !isFinite(b)) {
      return Number.NaN;
    }

    return gcd(a, b);
  });

  run.setOperation(ops.bitAnd, (params) => (context) => 
    // tslint:disable-next-line: no-bitwise
    _number(params.a, context) & _number(params.b, context)
  );

  run.setOperation(ops.bitOr, (params) => (context) => 
    // tslint:disable-next-line: no-bitwise
    _number(params.a, context) | _number(params.b, context)
  );

  run.setOperation(ops.bitXor, (params) => (context) => 
    // tslint:disable-next-line: no-bitwise
    _number(params.a, context) ^ _number(params.b, context)
  );

  run.setOperation(ops.cmp, (params) => (context) => 
    _number(params.value, context) - _number(params.test, context)
  );

  // Unary Operations

  run.setOperation(ops.maybe, (params) => (context) => 
    _numberMaybe(params.value, context)
  );

  run.setOperation(ops.sqrt, (params) => (context) => 
    Math.sqrt(_number(params.value, context))
  );

  run.setOperation(ops.sq, (params) => (context) => {
    const value = _number(params.value, context);

    return value * value;
  });

  run.setOperation(ops.cbrt, (params) => (context) => 
    Math.cbrt(_number(params.value, context))
  );

  run.setOperation(ops.floor, (params) => (context) => 
    Math.floor(_number(params.value, context))
  );

  run.setOperation(ops.ceil, (params) => (context) => 
    Math.ceil(_number(params.value, context))
  );

  run.setOperation(ops.up, (params) => (context) => {
    const value = _number(params.value, context);

    return value < 0 ? Math.ceil(value) : Math.floor(value);
  });

  run.setOperation(ops.down, (params) => (context) => {
    const value = _number(params.value, context);

    return value > 0 ? Math.ceil(value) : Math.floor(value);
  });

  run.setOperation(ops.round, (params) => (context) => 
    Math.round(_number(params.value, context))
  );

  run.setOperation(ops.abs, (params) => (context) => 
    Math.abs(_number(params.value, context))
  );

  run.setOperation(ops.neg, (params) => (context) => 
    -_number(params.value, context)
  );

  run.setOperation(ops.sign, (params) => (context) => {
    const value = _number(params.value, context);

    return value === 0 ? 0 : value < 0 ? -1 : 1;
  });

  run.setOperation(ops.log, (params) => (context) => 
    Math.log(_number(params.value, context))
  );

  run.setOperation(ops.sin, (params) => (context) => 
    Math.sin(_number(params.value, context))
  );

  run.setOperation(ops.cos, (params) => (context) => 
    Math.cos(_number(params.value, context))
  );

  run.setOperation(ops.tan, (params) => (context) => 
    Math.tan(_number(params.value, context))
  );

  run.setOperation(ops.sinh, (params) => (context) => 
    Math.sinh(_number(params.value, context))
  );

  run.setOperation(ops.cosh, (params) => (context) => 
    Math.cosh(_number(params.value, context))
  );

  run.setOperation(ops.asin, (params) => (context) => 
    Math.asin(_number(params.value, context))
  );

  run.setOperation(ops.acos, (params) => (context) => 
    Math.acos(_number(params.value, context))
  );

  run.setOperation(ops.atan, (params) => (context) => 
    Math.atan(_number(params.value, context))
  );

  run.setOperation(ops.factorial, (params) => (context) => {
    const value = _number(params.value, context);

    return isFinite(value) ? factorial(value) : value;
  });

  run.setOperation(ops.bitFlip, (params) => (context) => 
    // tslint:disable-next-line: no-bitwise
    ~_number(params.value, context)
  );

  // Other

  run.setOperation(ops.clamp, (params) => (context) => 
    Math.max(_number(params.min, context), Math.min(_number(params.value, context), _number(params.max, context)))
  );

  run.setOperation(ops.triangleHeight, (params) => (context) => {
    const base = _number(params.base, context);
    const side1 = _number(params.side1, context);
    const side2 = _number(params.side2, context);
    if (!isFinite(base) || !isFinite(side1) || !isFinite(side2)) {
      return Number.NaN;
    }

    return triangleHeight(base, side1, side2);
  });

  run.setOperation(ops.lerp, (params) => (context) => {
    const start = _number(params.start, context);
    const end = _number(params.end, context);
    const delta = _number(params.delta, context);

    return (end - start) * delta + start;
  });

  // Generators

  run.setOperation(ops.rnd, (params) => (context) => {
    const min = _number(params.min, context, 0);
    const max = _number(params.max, context, 1);
    const gap = max - min;
    const whole = _bool(params.whole, context, false);
    const include = _bool(params.includeMax, context, true);

    return whole
      ? include
        ? Math.floor((gap + 1) * Math.random()) + min
        : Math.floor(gap * Math.random()) + min
      : Math.random() * gap + min;
  });

  // Formatters

  run.setOperation(ops.toBaseText, (params) => (context) => {
    const value = _number(params.value, context);
    if (!isFinite(value)) {
      return value;
    }
    const base = _number(params.base, context, DEFAULT_BASE);
    const min = _number(params.minDigits, context, 0);
    
    let x = value.toString(base);

    while (x.length < min) x = '0' + x;
    
    return x;
  });

  run.setOperation(ops.toText, (params) => (context) => {
    const value = _number(params.value, context);
    if (!isFinite(value)) {
      return value;
    }

    return format(value, {
      prefix: _text(params.prefix, context),
      suffix:_text(params.suffix, context),
      minPlaces: _numberMaybe(params.minPlaces, context),
      maxPlaces: _numberMaybe(params.maxPlaces, context),
      useExponent: _bool(params.useExponent, context, false),
      separator: _textMaybe(params.thousandSeparator, context),
    });
  });

  run.setOperation(ops.toPercent, (params) => (context) => {
    const value = _number(params.value, context);
    if (!isFinite(value)) {
      return value;
    }

    return format(value * PERCENT_SCALE, {
      suffix: '%',
      minPlaces: _numberMaybe(params.minPlaces, context),
      maxPlaces: _numberMaybe(params.maxPlaces, context),
      separator: _textMaybe(params.thousandSeparator, context),
    });
  });

  run.setOperation(ops.fromPercent, (params) => (context) => {
    const percent = _text(params.value, context);
    const withoutSymbols = percent.replace(/[\$,%]/g, '');
    const value = parseFloat(withoutSymbols);

    return isFinite(value) ? value / PERCENT_SCALE : null;
  });

  // Comparisons

  run.setOperation(ops.isValid, (params) => (context) => 
    isNumber(params.value(context))
  );

  run.setOperation(ops.isZero, (params) => (context) => 
    Math.abs(_number(params.value, context)) <= _number(params.epsilon, context, epsilon)
  );

  run.setOperation(ops.isEqual, (params) => (context) => 
    Math.abs(_number(params.value, context) - _number(params.test, context)) <= _number(params.epsilon, context, epsilon)
  );

  run.setOperation(ops.isNotEqual, (params) => (context) => 
    Math.abs(_number(params.value, context) - _number(params.test, context)) > _number(params.epsilon, context, epsilon)
  );

  run.setOperation(ops.isLess, (params) => (context) => 
    _number(params.value, context) < _number(params.test, context)
  );

  run.setOperation(ops.isLessOrEqual, (params) => (context) => 
    _number(params.value, context) <= _number(params.test, context)
  );

  run.setOperation(ops.isGreater, (params) => (context) => 
    _number(params.value, context) > _number(params.test, context)
  );

  run.setOperation(ops.isGreaterOrEqual, (params) => (context) => 
    _number(params.value, context) >= _number(params.test, context)
  );

  run.setOperation(ops.isBetween, (params) => (context) => {
    const value = _number(params.value, context);
    const min = _number(params.min, context);
    const max = _number(params.max, context);
    const minInclusive = _bool(params.minInclusive, context, true);
    const maxInclusive = _bool(params.maxInclusive, context, true);

    const minCompare = value - min;
    const maxCompare = value - max;

    const minOffset = minInclusive ? 0 : 1;
    const maxOffset = maxInclusive ? 0 : -1;

    return minCompare >= minOffset && maxCompare <= maxOffset;
  });

  run.setOperation(ops.isWhole, (params) => (context) => {
    const value = _number(params.value, context);
    const eps = _number(params.epsilon, context, epsilon);

    return isWhole(value, eps);
  });

  run.setOperation(ops.isDecimal, (params) => (context) => {
    const value = _number(params.value, context);
    const eps = _number(params.epsilon, context, epsilon);

    return !isWhole(value, eps);
  });

  run.setOperation(ops.isPositive, (params) => (context) =>
    _number(params.value, context) >= 0
  );

  run.setOperation(ops.isNegative, (params) => (context) =>
    _number(params.value, context) < 0
  );

  run.setOperation(ops.isDivisible, (params) => (context) =>
    Math.abs(_number(params.value, context) % _number(params.by, context)) <= _number(params.epsilon, context, epsilon)
  );

  // Casts

  run.setOperation(ops.asAny, (params) => (context) =>
    params.value(context)
  );

  run.setOperation(ops.asBoolean, (params) => (context) =>
    !!params.value(context)
  );

  run.setOperation(ops.asColor, (params) => (context) => {
    const value = _number(params.value, context);

    // tslint:disable: no-magic-numbers no-bitwise
    const r = value & 0xFF;
    const g = (value >> 8) & 0xFF;
    const b = (value >> 16) & 0xFF;
    const a = (value >> 24) & 0xFF;
    // tslint:enable: no-magic-numbers no-bitwise

    return { r, g, b, a };
  });

  run.setOperation(ops.asDate, (params) => (context) =>
    parse(params.value(context)) || new Date()
  );

  run.setOperation(ops.asList, (params) => (context) =>
    _asList(params.value, context)
  );

  run.setOperation(ops.asMap, (params) => (context) =>
    _asMap(params.value, context)
  );

  run.setOperation(ops.asNumber, (params) => (context) => 
    params.value(context)
  );

  run.setOperation(ops.asObject, (params) => (context) => 
    _asObject(params.value, context)
  );

  run.setOperation(ops.asText, (params) => (context) => 
    params.value(context) + ''
  );

  run.setOperation(ops.asTuple, (params) => (context) => 
    _asTuple(params.value, context)
  );

  run.setOperation(ops.asSet, (params) => (context) => 
    _asSet(params.value, context)
  );

}


function getDecimalSeparator() {
  return SEPARATOR_NUMBER.toLocaleString().substring(1, SEPARATOR_OFFSET - 1);
}

function getThousandSeparator() {
  return getDecimalSeparator() === '.' ? ',' : '.';
}

interface FormatOptions {
  prefix?: string;
  suffix?: string; 
  minPlaces?: number;
  maxPlaces?: number;
  useExponent?: boolean;
  separator?: string;
}

function format(value: number, { prefix, suffix, minPlaces, maxPlaces, useExponent, separator }: FormatOptions): string {
  let to = '';
  const decimalSeparator = getDecimalSeparator();

  if (useExponent) {
    to = value.toExponential(isUndefined(maxPlaces) ? minPlaces : maxPlaces);
  } else {
    to = value.toPrecision();

    const i = to.indexOf(decimalSeparator);
    if (i !== -1) {
      const places = to.length - i - 1;
      if (isNumber(maxPlaces) && places > maxPlaces) {
        to = value.toFixed(maxPlaces);
      } else if (isNumber(minPlaces) && places < minPlaces) {
        to = value.toFixed(minPlaces);
      }
    } else if (isNumber(minPlaces)) {
      to = value.toFixed(minPlaces);
    }
  }

  if (isString(separator)) {
    
    const normalizedSeparator = separator === ','
      ? getThousandSeparator()
      : separator;
    let index = to.indexOf(decimalSeparator);
    if (index === -1) {
      index = to.length;
    }
    index -= SEPARATOR_OFFSET;
    while (index > 0) {
      to = to.substring(0, index) + normalizedSeparator + to.substring(index);
      index -= SEPARATOR_OFFSET;
    }
  }
  
  return (prefix || '') + to + (suffix || '');
}

function factorial (x: number): number {
  let f = x;
  while (--x > 1) {
    f *= x;
  }

  return f;
}

function gcd (a: number, b: number): number {
  const as = Math.abs(a);
  const bs = Math.abs(b);
  let x = Math.max(as, bs);
  let y = Math.min(as, bs);

  for (;;) {
    if (y === 0) return x;
    x %= y;
    if (x === 0) return y;
    y %= x;
  }
}

function choose(n: number, k: number): number 
{
  let num = 1; 
  let den = 1;
  let denom = 0;

  // tslint:disable-next-line: no-bitwise
  if (k > (n >> 1))
  {
    k = n - k;
  }

  while (k >= 1)
  {
    num *= n--;
    den *= k--;
    denom = gcd( num, den );
    num /= denom;
    den /= denom;
  }

  return num;
}

const HALF = 0.5;
const TWO = 2;

function triangleHeight(base: number, side1: number, side2: number): number 
{
  const p = (base + side1 + side2) * HALF;
  const area = Math.sqrt( p * (p - base) * (p - side1) * (p - side2) );
  const height = area * TWO / base;

  return height;
}