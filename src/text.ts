import metaphone from 'metaphone';
import SimpleCrypto from 'simple-crypto-js';
import { Md5 } from 'ts-md5/dist/md5';


import { TextOps, isString, parse, ColorType, COMPONENT_MAX } from 'expangine-runtime';
import { _number, _bool, _text, _numberMaybe, _asList, _asMap, _asObject, _asTuple, _textMaybe, _regex, preserveScope, _asSet } from './helper';
import { LiveRuntimeImpl } from './LiveRuntime';


export default function(run: LiveRuntimeImpl)
{
  const ops = TextOps;

  // Statics

  run.setOperation(ops.create, (params) => (context) => 
    ''
  );

  run.setOperation(ops.uuid, (params) => {
    function S4() {
      // tslint:disable-next-line: no-bitwise no-magic-numbers
      return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
    }

    return (context) => (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
  });

  // Operations

  run.setOperation(ops.maybe, (params) => (context) => 
    _textMaybe(params.value, context)
  );

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
    _text(params.value, context).split('')
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
    const LETTERS_ONLY = /[^a-z]/g;
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

  run.setOperation(ops.metaphone, (params) => (context) => metaphone(_text(params.value, context)));

  run.setOperation(ops.distance, (params) => {
    const distance = (a: string, b: string): number => {
      const distanceMatrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null));

      for (let i = 0; i <= a.length; i += 1) {
        distanceMatrix[0][i] = i;
      }

      for (let j = 0; j <= b.length; j += 1) {
        distanceMatrix[j][0] = j;
      }

      for (let j = 1; j <= b.length; j += 1) {
        for (let i = 1; i <= a.length; i += 1) {
          const indicator = a[i - 1] === b[j - 1] ? 0 : 1;
          distanceMatrix[j][i] = Math.min(
            distanceMatrix[j][i - 1] + 1,
            distanceMatrix[j - 1][i] + 1,
            distanceMatrix[j - 1][i - 1] + indicator,
          );
        }
      }

      return distanceMatrix[b.length][a.length];
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

  run.setOperation(ops.like, (params) => (context) => {
    const value = _text(params.value, context);
    const pattern = _text(params.pattern, context);
    const ignoreCase = _bool(params.ignoreCase, context, false);
    
    const valueCased = ignoreCase ? value.toLowerCase() : value;
    const patternCased = ignoreCase ? pattern.toLowerCase() : pattern;

    const regexPattern = patternCased
      .split('%')
      .map(x => x ? x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') : x)
      .join('.*')
    ;

    const regex = new RegExp('^' + regexPattern + '$');

    return !!valueCased.match(regex);
  });

  run.setOperation(ops.pad, (params) => (context) => {
    let value = _text(params.value, context);
    const padding = _text(params.padding, context) || ' ';
    const append = _bool(params.append, context);
    const min = _number(params.min, context);
    const max = _numberMaybe(params.max, context);

    if (append) { 
      while (value.length < min) {
        value = value + padding;
      }
    } else {
      while (value.length < min) {
        value = padding + value;
      }
    }

    if (max !== undefined) {
      if (value.length > max) {
        if (append) {
          value = value.substring(0, max);
        } else {
          value = value.substring(max - value.length, max);
        }
      }
    }

    return value;
  });

  run.setOperation(ops.regexTest, (params) => (context) => {
    const value = _text(params.value, context);
    const regex = _regex(params.regex, context, false, params.ignoreCase, params.multiline);
    
    return regex.test(value);
  });

  run.setOperation(ops.regexSplit, (params) => (context) => {
    const value = _text(params.value, context);
    const regex = _regex(params.regex, context, false, params.ignoreCase, params.multiline);
    const limit = _numberMaybe(params.limit, context);

    return value.split(regex, limit);
  });

  run.setOperation(ops.regexMatch, (params) => (context) => {
    const value = _text(params.value, context);
    const regex = _regex(params.regex, context, true, params.ignoreCase, params.multiline);
    
    return value.match(regex);
  });

  run.setOperation(ops.regexMatchAll, (params) => (context) => {
    const value = _text(params.value, context);
    const regex = _regex(params.regex, context, true, params.ignoreCase, params.multiline);
    const matches: Array<{ index: number, lastIndex: number, input: string, groups: string[] }> = [];
    
    let lastIndex = 0;
    let match: RegExpExecArray;

    // tslint:disable-next-line: no-conditional-assignment
    while ((match = regex.exec(value)) !== null) {
      if (lastIndex === regex.lastIndex) {
        return matches;
      }
      lastIndex = regex.lastIndex;
      matches.push({
        index: match.index,
        lastIndex: regex.lastIndex,
        input: match.input,
        groups: match.slice(),
      });
    }

    return matches;
  });

  run.setOperation(ops.regexReplace, (params) => (context) => {
    const value = _text(params.value, context);
    const regex = _regex(params.regex, context, params.all, params.ignoreCase, params.multiline);
    const replacement = _text(params.replacement, context);

    return value.replace(regex, replacement);
  });

  run.setOperation(ops.regexReplaceDynamic, (params, scope) => (context) => {
    const value = _text(params.value, context);
    const regex = _regex(params.regex, context, params.all, params.ignoreCase, params.multiline);

    return preserveScope(run, context, [scope.match], () => 
      value.replace(regex, (...givenArgs: any[]) => {
        const args: any[] = Array.prototype.slice.call(givenArgs);
        args.pop();

        const input = args.shift();
        const index = parseInt(args.pop());
        const lastIndex = regex.lastIndex;
        const groups = args;
        
        run.dataSet(context, scope.match, { index, lastIndex, input, groups });

        return params.replace(context);
      })
    );
  });

  run.setOperation(ops.regexIndexOf, (params) => (context) => {
    const value = _text(params.value, context);
    const regex = _regex(params.regex, context, true, params.ignoreCase, params.multiline);
    
    return value.search(regex);
  });

  // Other


  // Generators


  // Formatters

  run.setOperation(ops.base64, (params) => (context) => 
    btoa(_text(params.value, context))
  );

  run.setOperation(ops.unbase64, (params) => (context) => 
    atob(_text(params.value, context))
  );

  run.setOperation(ops.encodeURI, (params) => (context) => 
    encodeURI(_text(params.value, context))
  );

  run.setOperation(ops.decodeURI, (params) => (context) => 
    decodeURI(_text(params.value, context))
  );

  run.setOperation(ops.encodeURIComponent, (params) => (context) => 
    encodeURIComponent(_text(params.value, context))
  );

  run.setOperation(ops.decodeURIComponent, (params) => (context) => 
    decodeURIComponent(_text(params.value, context))
  );

  run.setOperation(ops.md5, (params) => (context) => 
    Md5.hashStr(_text(params.value, context))
  );

  run.setOperation(ops.encrypt, (params) => (context) => 
    new SimpleCrypto(_text(params.secret, context)).encrypt(_text(params.value, context))
  );

  run.setOperation(ops.decrypt, (params) => (context) => 
    new SimpleCrypto(_text(params.secret, context)).decrypt(_text(params.value, context))
  );

  run.setOperation(ops.toNumber, (params) => (context) => {
    const value = parseFloat(_text(params.value, context));

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

  run.setOperation(ops.isUuid, (params) => (context) => {
    const value = _text(params.value, context);

    return value.match(/^[\da-z]{8}\-[\da-z]{4}\-[\da-z]{4}\-[\da-z]{4}\-[\da-z]{12}$/i);
  });

  // Casts

  run.setOperation(ops.asAny, (params) => (context) =>
    params.value(context)
  );

  run.setOperation(ops.asBoolean, (params) => (context) =>
    /^(true|t|1|y|x)$/.test(_text(params.value, context))
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
    const text = _text(params.value, context, '0');
    const withoutSymbols = text.replace(/[\$,%]/g, '');
    const value = parseFloat(withoutSymbols);

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

  run.setOperation(ops.asSet, (params) => (context) => 
    _asSet(params.value, context)
  );

}

function compare(a: string, b: string, ignoreCase: boolean): number 
{
  return ignoreCase
    ? a.toLowerCase().localeCompare(b.toLowerCase())
    : a.localeCompare(b);
}