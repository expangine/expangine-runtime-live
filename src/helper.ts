
import { isNumber, isString, isArray, isMap, isObject, isDate, isBoolean, isColor, Color } from 'expangine-runtime';
import { LiveContext, LiveResult, LiveCommand } from './LiveRuntime';



export function saveScope<K extends string>(context: LiveContext, scope: Record<string, K>): Record<K, any> 
{
  const popped = {} as Record<K, string>;

  for (const prop in scope) 
  {
    const alias = scope[prop];

    popped[alias] = context[alias]
  }

  return popped;
}

export function restoreScope<K extends string>(context: LiveContext, saved: Record<K, any>) 
{
  for (const prop in saved)
  { 
    if (saved[prop] === undefined)
    {
      delete context[prop];
    }
    else
    {
      context[prop] = saved[prop];
    }
  }
}

export function preserveScope<R = any>(context: LiveContext, props: string[], run: () => R): R
{
  const saved = props.map((p) => context[p]);

  const result = run();

  saved.forEach((last, i) => 
    last === undefined
      ? delete context[props[i]]
      : context[props[i]] = last
  );

  return result;
}

export function _optional (cmd: LiveCommand | undefined, context: LiveContext, defaultValue?: LiveResult): LiveResult 
{
  return cmd ? cmd(context) : defaultValue;
}

export function _bool (cmd: LiveCommand | undefined, context: LiveContext, defaultValue: boolean = false): boolean
{
  return cmd ? !!cmd(context) : defaultValue;
}

export function _typed<T> (isValid: (value: any) => value is T, invalidValueDefault: T) 
{
  return (cmd: LiveCommand | undefined, context: LiveContext, invalidValue: T = invalidValueDefault) => 
  {
    if (!cmd) 
    {
      return invalidValue;
    }

    const value = cmd(context);

    return isValid(value) ? value : invalidValue;
  };
}

export function _typedDynamic<T> (isValid: (value: any) => value is T, invalidValueDefault: () => T) 
{
  return (cmd: LiveCommand | undefined, context: LiveContext, invalidValue: () => T = invalidValueDefault) => 
  {
    if (!cmd) 
    {
      return invalidValue();
    }

    const value = cmd(context);

    return isValid(value) ? value : invalidValue();
  };
}

export const _boolMaybe = _typed<boolean | undefined> (isBoolean, undefined);

export const _number = _typed (isNumber, Number.NaN);

export const _numberMaybe = _typed<number | undefined> (isNumber, undefined);

export const _text = _typed (isString, '');

export const _textMaybe = _typed<string | undefined> (isString, undefined);

export const _list  = _typedDynamic<any[]> (isArray, () => []);

export const _listMaybe = _typed<any[] | undefined> (isArray, undefined);

export const _map = _typedDynamic<Map<any, any>> (isMap, () => new Map());

export const _mapMaybe = _typed<Map<any, any> | undefined> (isMap, undefined);

export const _object = _typedDynamic<any>(isObject, () => ({}));

export const _objectMaybe = _typed<any | undefined>(isObject, undefined);

export const _color = _typedDynamic<Color>(isColor, () => ({ r: 255, g: 255, b: 255, a: 255 }));

export const _colorMaybe = _typed<any | undefined>(isColor, undefined);

export const _date = _typedDynamic<Date>(isDate, () => new Date());

export const _dateMaybe = _typed<Date | undefined> (isDate, undefined);

export function _asList(getValue: LiveCommand, context: LiveContext)
{
  return [ getValue(context) ];
}

export function _asMap(getValue: LiveCommand, context: LiveContext)
{
  return new Map([['value', getValue(context) ]]);
}

export function _asObject(getValue: LiveCommand, context: LiveContext)
{
  return { value: getValue(context) };
}

export function _asTuple(getValue: LiveCommand, context: any)
{
  return [ getValue(context) ];
}

export function _colorOrNumber(getValue: LiveCommand, context: any)
{
  const value = getValue(context);

  if (isColor(value))
  {
    return value;
  }

  if (isNumber(value))
  {
    return { r: value, g: value, b: value, a: value };
  }

  return { r: 255, g: 255, b: 255, a: 255 };
}
