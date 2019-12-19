
import { Runtime, DateOps, DateType, currentLocale, compareDates, startOf, mutate, add, getters, setters, endOf, getDaysInMonth, getDaysInYear, getWeeksInYear, diff, adjusters, getDateOffset, isDaylightSavingTime, isLeapYear, Unit, parse, DateFormat, isDate, COMPONENT_MAX } from 'expangine-runtime';
import { _number, _date, _text, _bool, _asList, _asMap, _asObject, _asTuple, _dateMaybe, _asSet } from './helper';
import { LiveContext, LiveResult } from './LiveRuntime';


export default function(run: Runtime<LiveContext, LiveResult>)
{
  const ops = DateOps;

  const MILLIS_IN_SECONDS = 1000;

  // Static

  run.setOperation(ops.create, (params) => (context) =>
    new Date()
  ),

  run.setOperation(ops.now, (params) => (context) =>
    new Date()
  ),

  run.setOperation(ops.today, (params) => (context) =>
    startOf.day(new Date())
  );

  run.setOperation(ops.tomorrow, (params) => (context) =>
    mutate(mutate(new Date(), startOf.day), d => add.day(d, +1))
  );

  run.setOperation(ops.yesterday, (params) => (context) =>
    mutate(mutate(new Date(), startOf.day), d => add.day(d, -1))
  );

  // Operations

  run.setOperation(ops.maybe, (params) => (context) => 
    _dateMaybe(params.value, context)
  );

  run.setOperation(ops.parse, (params) => (context) => 
    _bool(params.parseAsUTC, context, false)
      ? new DateType({ parseAsUTC: true }).normalize(params.value(context))
      : DateType.baseType.normalize(params.value(context))
  );

  run.setOperation(ops.fromText, (params) => (context) => 
    DateType.baseType.normalize(_text(params.value, context))
  );

  run.setOperation(ops.fromTimestamp, (params) => (context) => 
    new Date(_number(params.value, context, Date.now()))
  );

  run.setOperation(ops.fromTimestampSeconds, (params) => (context) => 
    new Date(_number(params.value, context, Date.now() / MILLIS_IN_SECONDS) * MILLIS_IN_SECONDS)
  );

  run.setOperation(ops.min, (params) => (context) => {
    const value = _date(params.value, context);
    const test = _date(params.test, context);

    return value.valueOf() < test.valueOf() ? value : test;
  });

  run.setOperation(ops.max, (params) => (context) => {
    const value = _date(params.value, context);
    const test = _date(params.test, context);

    return value.valueOf() > test.valueOf() ? value : test;
  });

  run.setOperation(ops.get, (params) => (context) => {
    const value = _date(params.value, context);
    const prop = _text(params.property, context, 'timestamp');
    
    return prop in getters ? getters[prop](value) : -1;
  });

  run.setOperation(ops.set, (params) => (context) => {
    let value = _date(params.value, context);
    const prop = _text(params.property, context, 'timestamp');
    const update = _number(params.set, context, 0);

    if (prop in setters) {
      value = new Date(value.getTime());
      setters[prop](value, update);
    }

    return value;
  });

  run.setOperation(ops.add, (params) => (context) => {
    let value = _date(params.value, context);
    const unit = _text(params.unit, context, 'millis');
    const amount = _number(params.amount, context, 1);

    if (unit in add) {
      value = new Date(value.getTime());
      add[unit](value, amount);
    }

    return value;
  });

  run.setOperation(ops.sub, (params) => (context) => {
    let value = _date(params.value, context);
    const unit = _text(params.unit, context, 'millis');
    const amount = _number(params.amount, context, 1);

    if (unit in add) {
      value = new Date(value.getTime());
      add[unit](value, -amount);
    }

    return value;
  });

  run.setOperation(ops.startOf, (params) => (context) => {
    const value = _date(params.value, context);
    const unit = _text(params.unit, context, 'day');

    return unit in startOf ? mutate(value, startOf[unit]) : value;
  });

  run.setOperation(ops.endOf, (params) => (context) => {
    const value = _date(params.value, context);
    const unit = _text(params.unit, context, 'day');

    return unit in endOf ? mutate(value, endOf[unit]) : value;
  });

  run.setOperation(ops.daysInMonth, (params) => (context) => 
    getDaysInMonth(_date(params.value, context))
  );

  run.setOperation(ops.daysInYear, (params) => (context) => 
    getDaysInYear(_date(params.value, context))
  );

  run.setOperation(ops.weeksInYear, (params) => (context) => 
    getWeeksInYear(_date(params.value, context))
  );

  run.setOperation(ops.copy, (params) => (context) =>
    new Date(_date(params.value, context).getTime())
  );

  run.setOperation(ops.cmp, (params) => (context) => {
    const value = _date(params.value, context);
    const test = _date(params.test, context);
    const unit = _text(params.unit, context, 'millis') as Unit;

    return unit in startOf ? compareDates(value, test, unit) : 0;
  });

  run.setOperation(ops.diff, (params) => (context) => {
    const value = _date(params.value, context);
    const test = _date(params.test, context);
    const unit = _text(params.unit, context, 'millis');
    const absolute = _bool(params.absolute, context, true);
    const adjust = _text(params.adjust, context, 'down');

    if (!(unit in diff) || !(adjust in adjusters))
    {
      return Number.NaN;
    }

    const amount = adjusters[adjust]( diff[unit](value, test) );

    return absolute ? Math.abs(amount) : amount;
  });

  run.setOperation(ops.timezoneOffset, (params) => (context) => 
    getDateOffset(_date(params.value, context))
  );

  run.setOperation(ops.toText, (params) => (context) =>
    DateFormat.format(_text(params.format, context), [_date(params.value, context), currentLocale])
  );

  run.setOperation(ops.toISOText, (params) => (context) => 
    _date(params.value, context).toISOString()
  );

  // Comparisons

  run.setOperation(ops.isValid, (params) => (context) => 
    isDate(params.value(context))
  );

  run.setOperation(ops.isEqual, (params, scope) => (context) =>
    run.getOperation(ops.cmp.id)(params, scope)(context) === 0
  );

  run.setOperation(ops.isBefore, (params, scope) => (context) =>
    run.getOperation(ops.cmp.id)(params, scope)(context) < 0
  );

  run.setOperation(ops.isBeforeOrEqual, (params, scope) => (context) =>
    run.getOperation(ops.cmp.id)(params, scope)(context) <= 0
  );

  run.setOperation(ops.isAfter, (params, scope) => (context) =>
    run.getOperation(ops.cmp.id)(params, scope)(context) > 0
  );

  run.setOperation(ops.isAfterOrEqual, (params, scope) => (context) =>
    run.getOperation(ops.cmp.id)(params, scope)(context) >= 0
  );

  run.setOperation(ops.isBetween, (params) => (context) => {
    const value = _date(params.value, context);
    const start = _date(params.start, context);
    const end = _date(params.end, context);
    const unit = _text(params.unit, context, 'millis') as Unit;
    const startInclusive = _bool(params.startInclusive, context, true);
    const endInclusive = _bool(params.endInclusive, context, false);

    const startCompare = compareDates(value, start, unit);
    const endCompare = compareDates(value, end, unit);
    
    const startOffset = startInclusive ? 0 : 1;
    const endOffset = endInclusive ? 0 : -1;

    return startCompare >= startOffset && endCompare <= endOffset;
  });

  run.setOperation(ops.isStartOf, (params) => (context) => {
    const value = _date(params.value, context);
    const unit = _text(params.unit, context, 'millis') as Unit;
    
    return unit in startOf
      ? mutate(value, startOf[unit]).getTime() === value.getTime()
      : false;
  });

  run.setOperation(ops.isEndOf, (params) => (context) => {
    const value = _date(params.value, context);
    const unit = _text(params.unit, context, 'millis') as Unit;
    
    return unit in endOf
      ? mutate(value, endOf[unit]).getTime() === value.getTime()
      : false;
  });

  run.setOperation(ops.isDST, (params) => (context) => 
    isDaylightSavingTime(_date(params.value, context))
  );

  run.setOperation(ops.isLeapYear, (params) => (context) => 
    isLeapYear(_date(params.value, context))
  );

  // Casts

  run.setOperation(ops.asAny, (params) => (context) =>
    params.value(context)
  );

  run.setOperation(ops.asBoolean, (params) => (context) =>
    true
  );

  run.setOperation(ops.asColor, (params) => (context) =>
    ({ r: COMPONENT_MAX, g: COMPONENT_MAX, b: COMPONENT_MAX, a: COMPONENT_MAX })
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

  run.setOperation(ops.asNumber, (params) => (context) => 
    _date(params.value, context).getTime()
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