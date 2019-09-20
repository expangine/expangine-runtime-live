import { Runtime, TextOps, isString, parse } from 'expangine-runtime';
import { _number, _bool, _text, _numberMaybe, _asList, _asMap, _asObject, _asTuple } from './helper';
import { LiveContext, LiveResult } from './runtime';


export default function(run: Runtime<LiveContext, LiveResult>)
{
  const ops = TextOps;

  // Statics

  run.setOperation(ops.create, (params) => (context) => 
    ''
  );

  // Operations

  run.setOperation(ops.append, (params) => (context) => 
    _text(params.value, context) + _text(params.append, context)
  );

  run.setOperation(ops.prepend, (params) => (context) => 
    _text(params.prepend, context) + _text(params.value, context)
  );

  run.setOperation(ops.lower, (params) => (context) => 
    _text(params.value, context).toLowerCase()
  );

  run.setOperation(ops.upper, (params) => (context) => 
    _text(params.value, context).toUpperCase()
  );

  run.setOperation(ops.char, (params) => (context) => {
    const value = _text(params.value, context);
    const index = _number(params.index, context);

    return index <= value.length ? value.charAt(index) : _text(params.outside, context);
  });

  run.setOperation(ops.replace, (params) => (context) => 
    _text(params.value, context).replace(_text(params.find, context), _text(params.replace, context))
  );

  run.setOperation(ops.repeat, (params) => (context) => {
    const value = _number(params.value, context);
    let times = _number(params.times, context);
    let repeated = '';
    while (--times >= 0){ 
      repeated += value;
    }

    return repeated;
  });

  run.setOperation(ops.split, (params) => (context) => 
    _text(params.value, context).split(_text(params.by, context), _numberMaybe(params.limit, context))
  );

  run.setOperation(ops.chars, (params) => (context) => 
    _text(params.value, context)
  );

  run.setOperation(ops.sub, (params) => (context) => 
    _text(params.value, context).substring(_number(params.start, context, 0), _numberMaybe(params.end, context))
  );

  run.setOperation(ops.indexOf, (params) => (context) => 
    _text(params.value, context).indexOf(_text(params.search, context), _numberMaybe(params.start, context))
  );

  run.setOperation(ops.lastIndexOf, (params) => (context) => 
    _text(params.value, context).lastIndexOf(_text(params.search, context), _numberMaybe(params.start, context))
  );

  run.setOperation(ops.trim, (params) => (context) => {
    let value = _text(params.value, context);
    if (_bool(params.start, context, true)) {
      value = value.replace(/^\w+/, '');
    }
    if (_bool(params.end, context, true)) {
      value = value.replace(/\w+$/, '');
    }

    return value;
  });

  run.setOperation(ops.startsWith, (params) => (context) => {
    const value = _text(params.value, context);
    const test = _text(params.test, context);

    return value.substring(0, test.length) === test;
  });

  run.setOperation(ops.endsWith, (params) => (context) => {
    const value = _text(params.value, context);
    const test = _text(params.test, context);

    return value.substring(value.length - test.length) === test;
  });

  run.setOperation(ops.soundex, (params) => {
    const LETTERS_ONLY = /[a-z]/g;
    const ALLOWED_ONLY = /[^bfpvcgjkqsxzdtlmnr]/g;
    const SOUNDEX_MIN_DEFAULT = 4;
    const MAP = {
      b: 1, f: 1, p: 1, v: 1,
      c: 2, g: 2, j: 2, k: 2, q: 2, s: 2, x: 2, z: 2,
      d: 3, t: 3,
      l: 4,
      m: 5, n: 5,
      r: 6
    };

    return (context) => {
      let value = _text(params.value, context);
      const max = _numberMaybe(params.max, context);
      const min = _number(params.min, context, SOUNDEX_MIN_DEFAULT);

      value = value.toLowerCase();
      value = value.replace(LETTERS_ONLY, '');
      value = value.charAt(0) + value.substring(1).replace(ALLOWED_ONLY, '');

      let soundex = value.charAt(0);

      for (let i = 1; i < value.length; i++) {
        soundex += MAP[value.charAt(i)];
      }
      
      let last = soundex.charAt(1)
      for (let i = 2; i < soundex.length; i++) { 
        if (soundex.charAt(i) === last) {
          soundex = soundex.substring(0, i) + soundex.substring(i + 1);
          i--;
        } else {
          last = soundex.charAt(i);
        }
      }

      if (isFinite(max)) {
        soundex = soundex.substring(0, max + 1);
      }

      while (soundex.length < min) {
        soundex += '0';
      }

      return soundex;
    };
  });

  run.setOperation(ops.distance, (params) => {
    const distance = (s: string, t: string): number => {
      if (!s.length) return t.length;
      if (!t.length) return s.length;

      return Math.min(
        distance(s.substring(1), t) + 1,
        distance(t.substring(1), s) + 1,
        distance(s.substring(1), t.substring(1)) + (s[0] !== t[0] ? 1 : 0)
      ) + 1;
    };
    
    return (context) => {
      const value = _text(params.value, context);
      const test = _text(params.test, context);

      return distance(value, test);
    };
  });

  run.setOperation(ops.length, (params) => (context) =>
    _text(params.value, context).length
  );

  run.setOperation(ops.compare, (params) => (context) =>
    compare(_text(params.value, context), _text(params.test, context), _bool(params.ignoreCase, context, false))
  );


  // Other


  // Generators


  // Formatters

  run.setOperation(ops.toNumber, (params) => (context) => {
    const value = parseInt(_text(params.value, context));

    return isFinite(value) 
      ? value 
      : _number(params.invalidValue, context, 0);
  });

  // Comparisons

  run.setOperation(ops.isValid, (params) => (context) => 
    isString(params.value(context))
  );

  run.setOperation(ops.isEmpty, (params) => (context) => 
    _text(params.value, context).length === 0
  );

  run.setOperation(ops.isNotEmpty, (params) => (context) => 
    _text(params.value, context).length !== 0
  );

  run.setOperation(ops.isEqual, (params) => (context) => 
    compare(_text(params.a, context), _text(params.b, context), _bool(params.ignoreCase, context, false)) === 0
  );

  run.setOperation(ops.isNotEqual, (params) => (context) => 
    compare(_text(params.a, context), _text(params.b, context), _bool(params.ignoreCase, context, false)) !== 0
  );

  run.setOperation(ops.isLess, (params) => (context) => 
    compare(_text(params.value, context), _text(params.test, context), _bool(params.ignoreCase, context, false)) < 0
  );

  run.setOperation(ops.isLessOrEqual, (params) => (context) => 
    compare(_text(params.value, context), _text(params.test, context), _bool(params.ignoreCase, context, false)) <= 0
  );

  run.setOperation(ops.isGreater, (params) => (context) => 
    compare(_text(params.value, context), _text(params.test, context), _bool(params.ignoreCase, context, false)) > 0
  );

  run.setOperation(ops.isGreaterOrEqual, (params) => (context) => 
    compare(_text(params.value, context), _text(params.test, context), _bool(params.ignoreCase, context, false)) >= 0
  );

  run.setOperation(ops.isLower, (params) => (context) => {
    const value = _text(params.value, context);

    return value.localeCompare(value.toLowerCase()) === 0;
  });

  run.setOperation(ops.isUpper, (params) => (context) => {
    const value = _text(params.value, context);

    return value.localeCompare(value.toUpperCase()) === 0;
  });

  // Casts

  run.setOperation(ops.asAny, (params) => (context) =>
    params.value(context)
  );

  run.setOperation(ops.asBoolean, (params) => (context) =>
    /^(true|t|1|y|x)$/.test(_text(params.value, context))
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
    params.value(context)
  );

  run.setOperation(ops.asTuple, (params) => (context) => 
    _asTuple(params.value, context)
  );

}

function compare(a: string, b: string, ignoreCase: boolean): number 
{
  return ignoreCase
    ? a.toLowerCase().localeCompare(b.toLowerCase())
    : a.localeCompare(b);
}