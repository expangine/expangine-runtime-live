import { ListOps, DataTypes, isBoolean, isEmpty, isDate, isNumber, isString, isArray, COMPONENT_MAX, isColor, isObject } from 'expangine-runtime';
import { _list, _optional, _number, _text, _bool, _asTuple, _asObject, _numberMaybe, _listMaybe, preserveScope } from './helper';
import { LiveCommand, LiveContext, LiveRuntimeImpl } from './LiveRuntime';


// tslint:disable: no-magic-numbers
// tslint:disable: one-variable-per-declaration


export default function(run: LiveRuntimeImpl)
{
  const ops = ListOps;


  function swap(arr: any[], i: number, k: number)
  {
    const temp = arr[i];
    run.arraySet(arr, i, arr[k]);
    run.arraySet(arr, k, temp);
  }

  // Static

  run.setOperation(ops.create, (params) => (context) => 
    []
  );

  run.setOperation(ops.createLike, (params) => (context) => 
    []
  );

  run.setOperation(ops.createFor, (params) => (context) => 
    []
  );

  // Operations

  run.setOperation(ops.maybe, (params) => (context) => 
    _listMaybe(params.value, context)
  );

  run.setOperation(ops.build, (params, scope) => (context) => {
    const n = _number(params.count, context);
    const list: any[] = [];

    if (n <= 0) 
    {
      return list;
    }

    preserveScope(run, context, [scope.index, scope.last, scope.list, scope.count], () => 
    {
      if (_bool(params.sameItem, context, false)) 
      {
        run.dataSet(context, scope.index, 0);
        run.dataSet(context, scope.last, undefined);
        run.dataSet(context, scope.list, list);
        run.dataSet(context, scope.count, n);

        const item = params.item(context);

        for (let i = 0; i < n; i++) 
        {
          run.arraySet(list, i, item);
        }
      } 
      else 
      {
        let last;

        for (let i = 0; i < n; i++) 
        {
          run.dataSet(context, scope.index, i);
          run.dataSet(context, scope.last, last);
          run.dataSet(context, scope.list, list);
          run.dataSet(context, scope.count, n);

          const item = params.item(context);

          last = item;
          run.arrayAdd(list, item);
        }
      }
    });

    return list;
  });

  run.setOperation(ops.get, (params) => (context) =>
    _list(params.list, context)[_number(params.index, context)]
  );

  run.setOperation(ops.set, (params) => (context) => {
    const list = _list(params.list, context);
    const index = _number(params.index, context);
    const prev = list[index];

    run.arraySet(list, index, params.value(context));

    return prev;
  });

  run.setOperation(ops.add, (params) => (context) => {
    const list = _list(params.list, context);
    const item = _optional(params.item, context);
    if (item !== undefined) {
      run.arrayAdd(list, item);
    }

    return list;
  });

  run.setOperation(ops.addFirst, (params) => (context) => {
    const list = _list(params.list, context);
    const item = _optional(params.item, context);
    if (item !== undefined) {
      run.arrayAddFirst(list, item);
    }

    return list;
  });

  run.setOperation(ops.addLast, (params) => (context) => {
    const list = _list(params.list, context);
    const item = _optional(params.item, context);
    if (item !== undefined) {
      run.arrayAdd(list, item);
    }

    return list;
  });

  run.setOperation(ops.insert, (params) => (context) => {
    const list = _list(params.list, context);
    const item = _optional(params.item, context);
    const index = _number(params.index, context, 0);
    if (item !== undefined) {
      run.arrayInsert(list, index, item);
    }

    return list;
  });

  run.setOperation(ops.remove, (params, scope) => (context) => 
    handleListIsEqual(
      _list(params.list, context), 
      context, 
      params, 
      scope, 
      params.item(context), 
      n => 0, 
      n => n, 
      (_, i, list) => (run.arrayRemoveAt(list, i), i), 
      () => -1
    )
  );

  run.setOperation(ops.removeFirst, (params, scope) => (context) => 
    run.arrayRemoveFirst(_list(params.list, context))
  );

  run.setOperation(ops.removeLast, (params, scope) => (context) => 
    run.arrayRemoveLast(_list(params.list, context))
  );

  run.setOperation(ops.removeAt, (params, scope) => (context) => {
    const list = _list(params.list, context);
    const index = _number(params.index, context, -1);
    let item;
    if (index >= 0 && index < list.length) {
      item = run.arrayRemoveAt(list, index);
    }

    return item;
  });

  run.setOperation(ops.removeWhere, (params, scope) => (context) =>
    handleListIteration(
      _list(params.list, context), 
      context, 
      scope, 
      n => n - 1, 
      n => -1,
      [],
      (item, index, list, removed) => {
        if (params.where(context)) {
          removed.push(item);
          run.arrayRemoveAt(list, index);
        }
        
        return removed;
      }
    )
  );

  run.setOperation(ops.clear, (params, scope) => (context) => {
    const list = _list(params.list, context);

    run.arrayClear(list);
    
    return list;
  });

  run.setOperation(ops.contains, (params, scope) => (context) =>
    handleListIsEqual(
      _list(params.list, context), 
      context, 
      params, 
      scope, 
      params.item(context), 
      n => 0, 
      n => n,
      () => true, 
      () => false
    )
  );

  run.setOperation(ops.find, (params, scope) => (context) => {
    const reverse = _bool(params.reverse, context);
    const list = _list(params.list, context);
    const n = list.length;
    const start = _number(params.start, context, reverse ? n - 1 : 0);
    const clampedStart = Math.max(0, Math.min(n - 1, start));
    const end = reverse ? -1 : n;
    const inReverse = clampedStart > end;

    if (reverse !== inReverse) {
      return undefined;
    }

    return handleListIteration(
      list,
      context,
      scope,
      () => start,
      () => end,
      undefined,
      (item, index) => {
        if (params.where(context)) {
          return item;
        }
      },
      true
    );
  });

  run.setOperation(ops.copy, (params, scope) => (context) => {
    const list = _list(params.list, context);

    if (!params.deepCopy) {
      return list.slice();
    }

    return preserveScope(run, context, [scope.copy], () => {
      return list.map(item => {
        run.dataSet(context, scope.copy, item);
        
        return params.deepCopy(context);
      });
    });
  });

  run.setOperation(ops.reverse, (params) => (context) => {
    const list = _list(params.list, context);
    const half = Math.floor(list.length / 2); 
    
    for (let i = 0, j = list.length - 1; i < half; i++, j--) { 
      swap(list, i, j);
    }
    
    return list;
  });

  run.setOperation(ops.exclude, (params, scope) => (context) => {
    const list = _list(params.list, context);
    const exclude = _list(params.exclude, context);

    for (const item of exclude) 
    {
      handleListIsEqual(list, context, params, scope, item, n => 0, n => n, (_, k) => (list.splice(k, 1), true), () => false);
    }

    return list;
  });

  run.setOperation(ops.overlap, (params, scope) => (context) => {
    const list = _list(params.list, context);
    const overlap = _list(params.overlap, context);
    const overlapping: any[] = [];

    for (const item of overlap) 
    {
      if (handleListIsEqual(list, context, params, scope, item, n => 0, n => n, () => true, () => false))
      {
        overlapping.push(item)
      }
    }

    return overlapping;
  });

  run.setOperation(ops.sort, (params, scope) => (context) => {
    const list = _list(params.list, context);

    preserveScope(run, context, [scope.list, scope.value, scope.test], () => {
      list.sort((value, test) => {
        run.dataSet(context, scope.list, list);
        run.dataSet(context, scope.value, value);
        run.dataSet(context, scope.test, test);

        return _number(params.compare, context, 0);
      });
    });

    return list;
  });

  run.setOperation(ops.shuffle, (params) => (context) => {
    const list = _list(params.list, context);
    let times = _number(params.times, context, 1);
    const n = list.length;

    while (--times >= 0) {
      for (let i = 0; i < n; i++) {
        swap(list, i, Math.floor(Math.random() * n));
      }
    }

    return list;
  });

  run.setOperation(ops.unique, (params, scope) => (context) => {
    const list = _list(params.list, context);
    const skip = {};
    const unique = [];

    for (let i = 0; i < list.length - 1; i++) {
      if (skip[i]) {
        continue;
      }

      const item = list[i];
      const exists = handleListIsEqual(list, context, params, scope, item, n => i + 1, n => n, (_, k) => skip[k] = true, () => false);

      if (!exists) {
        unique.push(item);
      }
    }

    return unique;
  });

  run.setOperation(ops.duplicates, (params, scope) => (context) => {
    const list = _list(params.list, context);
    const once = _bool(params.once, context, false);
    const skip = {};
    const duplicates = [];

    for (let i = 0; i < list.length; i++) {

      const item = list[i];

      if (skip[i]) {
        if (once) {
          continue;
        } else {
          duplicates.push(item);
        }
      }
      
      const exists = handleListIsEqual(list, context, params, scope, item, n => i + 1, n => n, (_, k) => skip[k] = true, () => false);

      if (exists) {
        duplicates.push(item);
      }
    }

    return duplicates;
  });

  run.setOperation(ops.take, (params) => (context) => 
    _list(params.list, context).slice(0, _number(params.count, context))
  );

  run.setOperation(ops.skip, (params) => (context) => 
    _list(params.list, context).slice(_number(params.count, context))
  );

  run.setOperation(ops.drop, (params) => (context) => {
    const list = _list(params.list, context);
    const count = _number(params.count, context);

    return list.slice(0, list.length - count);
  });

  run.setOperation(ops.append, (params) => (context) => {
    const list = _list(params.list, context);
    const append = _list(params.append, context);

    return list.concat(append);
  });

  run.setOperation(ops.prepend, (params) => (context) => {
    const list = _list(params.list, context);
    const prepend = _list(params.prepend, context);

    return prepend.concat(list);
  });

  run.setOperation(ops.indexOf, (params, scope) => (context) =>
    handleListIsEqual(
      _list(params.list, context), 
      context, 
      params, 
      scope, 
      params.item(context), 
      n => Math.max(0, Math.min(n, _number(params.start, context, 0))), 
      n => n, 
      (_, i) => i, 
      () => -1
    )
  );

  run.setOperation(ops.lastIndexOf, (params, scope) => (context) =>
    handleListIsEqual(
      _list(params.list, context),
      context, 
      params, 
      scope, 
      params.item(context), 
      n => Math.max(0, Math.min(n - 1, _number(params.start, context, n - 1))), 
      n => -1, 
      (_, i) => i, 
      () => -1
    )
  );

  run.setOperation(ops.findIndex, (params, scope) => (context) => {
    const reverse = _bool(params.reverse, context);
    const list = _list(params.list, context);
    const n = list.length;
    const start = _number(params.start, context, reverse ? n - 1 : 0);
    const clampedStart = Math.max(0, Math.min(n - 1, start));
    const end = reverse ? -1 : n;
    const inReverse = clampedStart > end;

    if (reverse !== inReverse) {
      return -1;
    }

    return handleListIteration(
      list,
      context,
      scope,
      () => start,
      () => end,
      -1,
      (item, index) => {
        if (params.where(context)) {
          return index;
        }
      },
      true
    );
  });

  run.setOperation(ops.last, (params) => (context) => {
    const list = _list(params.list, context);

    return list[list.length - 1];
  });

  run.setOperation(ops.first, (params) => (context) => 
    _list(params.list, context)[0]
  );

  run.setOperation(ops.count, (params) => (context) =>
    _list(params.list, context).length
  );

  run.setOperation(ops.randomList, (params) => (context) => {
    const list = _list(params.list, context);
    const n = list.length;
    const count = Math.min(_number(params.count, context, 0), n);

    if (count === n)
    {
      return list.slice();
    }

    const taken = {};
    const random = [];

    while (random.length < count)
    {
      const i = Math.floor(Math.random() * n);

      if (!taken[i])
      {
        random.push(list[i]);
        taken[i] = true;
      }
    }

    return random;
  });

  run.setOperation(ops.random, (params) => (context) => {
    const list = _list(params.list, context);

    return list[Math.floor(Math.random() * list.length)];
  });

  run.setOperation(ops.flatten, (params) => (context) => {
    const list = _list(params.list, context);
    const flattened = Object.create(null);

    for (const obj of list) {
      if (isObject(obj)) {
        for (const prop in obj) {
          const value = obj[prop];

          if (value !== null && value !== undefined) {
            flattened[prop] = value;
          }
        }
      }
    }

    return flattened;
  });

  // Iteration

  run.setOperation(ops.join, (params, scope) => (context) =>
    _text(params.prefix, context) + 
    handleListIteration(
      _list(params.list, context), 
      context, 
      scope, 
      n => 0, 
      n => n,
      '',
      (item, index, list, sum) => (
        sum
          ? sum 
            + _text(params.delimiter, context, ', ') 
            + _text(params.toText, context, item)
          : sum
            + _text(params.toText, context, item)
      )
    ) +
    _text(params.suffix, context)
  );

  run.setOperation(ops.each, (params, scope) => (context) => {
    const list = _list(params.list, context);
    const reverse = _bool(params.reverse, context, false);

    handleListIteration(list, context, scope, 
      n => reverse ? n - 1 : 0, 
      n => reverse ? 0 - 1 : n, 
      undefined,
      () => params.each(context)
    );

    return list;
  });

  run.setOperation(ops.filter, (params, scope) => (context) =>
    handleListIteration(
      _list(params.list, context),
      context, 
      scope, 
      n => 0, 
      n => n, 
      [],
      (item, index, list, matches) => {
        if (params.filter(context)) {
          matches.push(item);
        }
        
        return matches;
      }
    )
  );

  run.setOperation(ops.not, (params, scope) => (context) =>
    handleListIteration(
      _list(params.list, context), 
      context, 
      scope, 
      n => 0, 
      n => n, 
      [],
      (item, index, list, matches) => {
        if (!params.not(context)) {
          matches.push(item);
        }
        
        return matches;
      }
    )
  );

  run.setOperation(ops.map, (params, scope) => (context) => 
    handleListIteration(
      _list(params.list, context), 
      context, 
      scope, 
      n => 0, 
      n => n, 
      [],
      (item, index, list, mapped) => {
        mapped.push(params.transform(context));
        
        return mapped;
      }
    )
  );

  run.setOperation(ops.split, (params, scope) => (context) =>
    handleListIteration(
      _list(params.list, context), 
      context, 
      scope, 
      n => 0, 
      n => n, 
      { pass: [], fail: [] },
      (item, index, list, result) => {
        if (params.pass(context)) {
          result.pass.push(item);
        } else {
          result.fail.push(item);
        }

        return result;
      }
    )
  );

  run.setOperation(ops.reduce, (params, scope) => (context) =>
    handleListIteration(_list(params.list, context), context, scope, 
      n => 0, 
      n => n, 
      params.initial(context),
      (item, index, list, reduced) => {
        run.dataSet(context, scope.reduced, reduced);

        return params.reduce(context);
      }
    )
  );

  run.setOperation(ops.cmp, (params, scope) => (context) => {
    const list = _list(params.value, context);
    const test = _list(params.test, context);
    
    if (list.length !== test.length) 
    {
      return list.length - test.length;
    }

    let less = 0, more = 0;

    preserveScope(run, context, [scope.list, scope.value, scope.test], () => {
      for (let i = 0; i < list.length; i++) {
        run.dataSet(context, scope.list, list);
        run.dataSet(context, scope.value, list[i]);
        run.dataSet(context, scope.test, test[i]);

        const d = _number(params.compare, context, 0);

        if (d < 0) less++;
        else if (d > 0) more++;
      }
    });

    return DataTypes.getCompare(less, more);
  });

  run.setOperation(ops.group, (params, scope) => (context) => {
    const list = _list(params.list, context);

    return preserveScope(run, context, [scope.index, scope.item, scope.list], () => {
      type Grouping = { by: any, group: any[] };

      const map = new Map<any, Grouping>();
      const groups: Grouping[] = [];

      for (let i = 0; i < list.length; i++) {
        const value = list[i];

        run.dataSet(context, scope.index, i);
        run.dataSet(context, scope.item, value);
        run.dataSet(context, scope.list, list);

        const by = params.by(context);
        const grouping = map.get(by);
        const keyValue = _optional(params.getValue, context, value);

        if (grouping) {
          grouping.group.push(keyValue);
        } else {
          const newGrouping: Grouping = {
            by, group: [ keyValue ],
          };
          groups.push(newGrouping);
          map.set(by, newGrouping);
        }
      }

      return groups;
    });
  });

  run.setOperation(ops.toListMap, (params, scope) => (context) => {
    const list = _list(params.list, context);

    return preserveScope(run, context, [scope.index, scope.item, scope.list], () => {
      const map = new Map<any, any[]>();

      for (let i = 0; i < list.length; i++) {
        const value = list[i];

        run.dataSet(context, scope.index, i);
        run.dataSet(context, scope.item, value);
        run.dataSet(context, scope.list, list);

        const key = params.getKey(context);
        const keyList = map.get(key);
        const keyValue = _optional(params.getValue, context, value);

        if (keyList) {
          keyList.push(keyValue);
        } else {
          map.set(key, [
            keyValue
          ]);
        }
      }

      return map;
    });
  });

  run.setOperation(ops.toMap, (params, scope) => (context) => {
    const list = _list(params.list, context);

    return preserveScope(run, context, [scope.index, scope.item, scope.list], () => {
      const map = new Map();

      for (let i = 0; i < list.length; i++) {
        const item = list[i];

        run.dataSet(context, scope.index, i);
        run.dataSet(context, scope.item, item);
        run.dataSet(context, scope.list, list);

        const key = params.getKey(context);
        const value = _optional(params.getValue, context, item);

        map.set(key, value);
      }

      return map;
    });
  });

  // Joins

  run.setOperation(ops.joinInner, (params, scope) => (context) => {
    const a = _list(params.a, context);
    const b = _list(params.b, context);

    return preserveScope(run, context, [scope.onA, scope.onB, scope.joinA, scope.joinB], () => {
      const results: any[] = [];

      for (const itemA of a) {
        for (const itemB of b) {
          run.dataSet(context, scope.onA, itemA);
          run.dataSet(context, scope.onB, itemB);

          if (params.on(context)){ 
            run.dataSet(context, scope.joinA, itemA);
            run.dataSet(context, scope.joinB, itemB);

            results.push(params.join(context));
          }
        }
      }

      return results;
    }); 
  });

  run.setOperation(ops.joinLeft, (params, scope) => (context) => {
    const a = _list(params.a, context);
    const b = _list(params.b, context);

    return preserveScope(run, context, [scope.onA, scope.onB, scope.joinA, scope.joinB], () => {
      const results: any[] = [];

      for (const itemA of a) {
        let added = false;
        
        for (const itemB of b) {
          run.dataSet(context, scope.onA, itemA);
          run.dataSet(context, scope.onB, itemB);

          if (params.on(context)){ 
            run.dataSet(context, scope.joinA, itemA);
            run.dataSet(context, scope.joinB, itemB);

            results.push(params.join(context));
            added = true;
          }
        }

        if (!added) {
          run.dataSet(context, scope.joinA, itemA);
          run.dataSet(context, scope.joinB, undefined);
          results.push(params.join(context));
        }
      }

      return results;
    }); 
  });

  run.setOperation(ops.joinRight, (params, scope) => (context) => {
    const a = _list(params.a, context);
    const b = _list(params.b, context);

    return preserveScope(run, context, [scope.onA, scope.onB, scope.joinA, scope.joinB], () => {
      const results: any[] = [];

      for (const itemB of b) {
        let added = false;
        
        for (const itemA of a) {
          run.dataSet(context, scope.onA, itemA);
          run.dataSet(context, scope.onB, itemB);

          if (params.on(context)){ 
            run.dataSet(context, scope.joinA, itemA);
            run.dataSet(context, scope.joinB, itemB);

            results.push(params.join(context));
            added = true;
          }
        }

        if (!added) {
          run.dataSet(context, scope.joinA, undefined);
          run.dataSet(context, scope.joinB, itemB);
          results.push(params.join(context));
        }
      }

      return results;
    }); 
  });

  run.setOperation(ops.joinFull, (params, scope) => (context) => {
    const a = _list(params.a, context);
    const b = _list(params.b, context);

    return preserveScope(run, context, [scope.onA, scope.onB, scope.joinA, scope.joinB], () => {
      const results: any[] = [];
      const joined: boolean[] = [];

      for (const itemA of a) {
        let added = false;
        
        for (let i = 0; i < b.length; i++) {
          const itemB = b[i];

          run.dataSet(context, scope.onA, itemA);
          run.dataSet(context, scope.onB, itemB);

          if (params.on(context)){ 
            run.dataSet(context, scope.joinA, itemA);
            run.dataSet(context, scope.joinB, itemB);

            results.push(params.join(context));
            joined[i] = true;
            added = true;
          }
        }

        if (!added) {
          run.dataSet(context, scope.joinA, itemA);
          run.dataSet(context, scope.joinB, undefined);
          results.push(params.join(context));
        }
      }

      for (let i = 0; i < b.length; i++) {
        if (!joined[i]) {
          const itemB = b[i];

          run.dataSet(context, scope.joinA, undefined);
          run.dataSet(context, scope.joinB, itemB);
          results.push(params.join(context));
        }
      }

      return results;
    }); 
  });

  run.setOperation(ops.joinCross, (params, scope) => (context) => {
    const a = _list(params.a, context);
    const b = _list(params.b, context);

    return preserveScope(run, context, [scope.joinA, scope.joinB], () => {
      const results: any[] = [];
    
      for (const itemA of a) {
        for (const itemB of b) {
          run.dataSet(context, scope.joinA, itemA);
          run.dataSet(context, scope.joinB, itemB);

          results.push(params.join(context));
        }
      }

      return results;
    }); 
  });

  // Aggregates

  run.setOperation(ops.min, (params, scope) => (context) => 
    handleAggregate<number | null>(
      _list(params.list, context),
      context,
      scope,
      null,
      (item, index, list, agg) => {
        const value = _numberMaybe(params.value, context);
        if (value !== undefined) {
          agg = agg === null ? value : Math.min(value, agg);
        }
        
        return agg;
      },
      (agg) => agg,
    )
  );

  run.setOperation(ops.max, (params, scope) => (context) => 
    handleAggregate<number | null>(
      _list(params.list, context),
      context,
      scope,
      null,
      (item, index, list, agg) => {
        const value = _numberMaybe(params.value, context);
        if (value !== undefined) {
          agg = agg === null ? value : Math.max(value, agg);
        }
        
        return agg;
      },
      (agg) => agg,
    )
  );

  run.setOperation(ops.sum, (params, scope) => (context) => 
    handleAggregate<number | null>(
      _list(params.list, context),
      context,
      scope,
      null,
      (item, index, list, agg) => {
        const value = _numberMaybe(params.value, context);
        if (value !== undefined) {
          agg = agg === null ? value : value + agg;
        }
        
        return agg;
      },
      (agg) => agg,
    )
  );

  run.setOperation(ops.avg, (params, scope) => (context) => 
    handleAggregate(
      _list(params.list, context),
      context,
      scope,
      { count: 0, sum: 0 },
      (item, index, list, agg) => {
        const value = _numberMaybe(params.value, context);
        if (value !== undefined) {
          agg.count++;
          agg.sum += value;
        }
        
        return agg;
      },
      (agg) => agg.count === 0 ? null : agg.sum / agg.count,
    )
  );

  run.setOperation(ops.std, (params, scope) => (context) => 
    handleAggregate(
      _list(params.list, context),
      context,
      scope,
      { count: 0, sum: 0, values: [] as number[] },
      (item, index, list, agg) => {
        const value = _numberMaybe(params.value, context);
        if (value !== undefined) {
          agg.count++;
          agg.sum += value;
          agg.values.push(value);
        }
        
        return agg;
      },
      (agg) => {
         if (agg.count === 0) {
           return null;
         }
         const avg = agg.sum / agg.count;
         const squareSum = agg.values.reduce((sum, v) => sum + (v - avg) * (v - avg), 0);
         const squareAvg = squareSum / agg.count;

         return Math.sqrt(squareAvg);
      },
    )
  );

  run.setOperation(ops.variance, (params, scope) => (context) => 
    handleAggregate(
      _list(params.list, context),
      context,
      scope,
      { count: 0, sum: 0, values: [] as number[] },
      (item, index, list, agg) => {
        const value = _numberMaybe(params.value, context);
        if (value !== undefined) {
          agg.count++;
          agg.sum += value;
          agg.values.push(value);
        }
        
        return agg;
      },
      (agg) => {
         if (agg.count === 0) {
           return null;
         }
         if (agg.count === 1) {
           return 0;
         }
         const avg = agg.sum / agg.count;
         const squareSum = agg.values.reduce((sum, v) => sum + (v - avg) * (v - avg), 0);
         const squareAvg = squareSum / (agg.count - 1);

         return Math.sqrt(squareAvg);
      },
    )
  );

  run.setOperation(ops.median, (params, scope) => (context) => 
    handleAggregate(
      _list(params.list, context),
      context,
      scope,
      { values: [] as number[] },
      (item, index, list, agg) => {
        const value = _numberMaybe(params.value, context);
        if (value !== undefined) {
          agg.values.push(value);
        }
        
        return agg;
      },
      (agg) => agg.values.length === 0
        ? null
        : agg.values.length % 2 === 1
          ? agg.values[Math.floor(agg.values.length / 2)]
          : (
              agg.values[Math.floor(agg.values.length / 2) - 1] +
              agg.values[Math.floor(agg.values.length / 2)]
          ) / 2,
    )
  );

  run.setOperation(ops.bitand, (params, scope) => (context) => 
    handleAggregate<number | null>(
      _list(params.list, context),
      context,
      scope,
      0xffffffff,
      (item, index, list, agg) => {
        const value = _numberMaybe(params.value, context);
        if (value !== undefined) {
          // tslint:disable-next-line: no-bitwise
          agg = agg & value;
        }
        
        return agg;
      },
      (agg) => agg,
    )
  );

  run.setOperation(ops.bitor, (params, scope) => (context) => 
    handleAggregate<number | null>(
      _list(params.list, context),
      context,
      scope,
      0,
      (item, index, list, agg) => {
        const value = _numberMaybe(params.value, context);
        if (value !== undefined) {
          // tslint:disable-next-line: no-bitwise
          agg = agg | value;
        }
        
        return agg;
      },
      (agg) => agg,
    )
  );

  run.setOperation(ops.bitxor, (params, scope) => (context) => 
    handleAggregate<number | null>(
      _list(params.list, context),
      context,
      scope,
      0,
      (item, index, list, agg) => {
        const value = _numberMaybe(params.value, context);
        if (value !== undefined) {
          // tslint:disable-next-line: no-bitwise
          agg = agg ^ value;
        }
        
        return agg;
      },
      (agg) => agg,
    )
  );

  // Comparisons

  run.setOperation(ops.isValid, (params) => (context) => 
    isArray(params.value(context))
  );

  run.setOperation(ops.isEmpty, (params, scope) => (context) =>
    _list(params.list, context).length === 0
  );

  run.setOperation(ops.isNotEmpty, (params, scope) => (context) =>
    _list(params.list, context).length > 0
  );

  run.setOperation(ops.isEqual, (params, scope) => (context) => {
    const list = _list(params.list, context);
    const test = _list(params.test, context);
    
    if (list.length !== test.length) 
    {
      return false;
    }

    let equal = true;

    preserveScope(run, context, [scope.list, scope.value, scope.test], () => {
      for (let i = 0; i < list.length; i++) {
        run.dataSet(context, scope.list, list);
        run.dataSet(context, scope.value, list[i]);
        run.dataSet(context, scope.test, test[i]);

        if (!params.isEqual(context)) {
          equal = false;
          break;
        }
      }
    });

    return equal;
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
    tryCastValue(params.value, context, isBoolean, (v) => !isEmpty(v))
  );

  run.setOperation(ops.asColor, (params) => (context) =>
    tryCastValue(params.value, context, isColor, () =>  ({ r: COMPONENT_MAX, g: COMPONENT_MAX, b: COMPONENT_MAX, a: COMPONENT_MAX }))
  );

  run.setOperation(ops.asDate, (params) => (context) =>
    tryCastValue(params.value, context, isDate, () => new Date())
  );

  run.setOperation(ops.asList, (params) => (context) => 
    _list(params.value, context)
  );

  run.setOperation(ops.asMap, (params) => (context) => {
    const value = _list(params.value, context);

    return new Map(value.map((v, i) => [i.toString(), v]));
  });

  run.setOperation(ops.asNumber, (params) => (context) => 
    tryCastValue(params.value, context, isNumber, (v) => v.length)
  );

  run.setOperation(ops.asObject, (params) => (context) => 
    _asObject(params.value, context)
  );

  run.setOperation(ops.asText, (params) => (context) => 
    tryCastValue(params.value, context, isString, () => '')
  );

  run.setOperation(ops.asTuple, (params) => (context) => 
    _asTuple(params.value, context)
  );

  run.setOperation(ops.asSet, (params) => (context) => 
    new Set(_list(params.value, context))
  );

  function tryCastValue(value: LiveCommand, context: LiveContext, isType: (value: any) => boolean, otherwise: (value: any) => any)
  {
    const val = value(context);

    return isArray(val) && isType(val[0])
      ? val[0]
      : otherwise(val);
  }

  function handleAggregate<A>(
    list: any[],
    context: LiveContext,
    scope: Record<'list' | 'item' | 'index', string>,
    initialAggregate: A,
    aggregate: (current: any, index: number, list: any[], aggregate: A) => A,
    getAggregate: (aggregate: A) => number | null,
  ): number | null {
    return preserveScope(run, context, [scope.list, scope.item, scope.index], () =>
    {
      let agg: A | null = initialAggregate;

      for (let i = 0; i < list.length; i++)
      {
        const item = list[i];

        run.dataSet(context, scope.list, list);
        run.dataSet(context, scope.item, item);
        run.dataSet(context, scope.index, i);

        agg = aggregate(item, i, list, agg);
      }

      return getAggregate(agg);
    });
  }

  function handleListIteration<R>(
    list: any[],
    context: LiveContext,
    scope: Record<'list' | 'item' | 'index', string>,
    start: (n: number) => number,
    end: (n: number) => number,
    initialResult: R,
    onItem: (current: any, index: number, list: any[], lastResult: R) => R,
    earlyExit: boolean = false
  ): R 
  {
    return preserveScope(run, context, [scope.list, scope.item, scope.index], () => 
    {
      const n = list.length;
      let i = start(n);
      const e = end(n);
      const d = i < e ? 1 : -1;
      let result = initialResult;

      while (i !== e)
      {
        const item = list[i];

        run.dataSet(context, scope.list, list);
        run.dataSet(context, scope.item, item);
        run.dataSet(context, scope.index, i);

        const newResult = onItem(item, i, list, result);

        if (earlyExit)
        {
          if (newResult !== undefined)
          {
            return newResult;
          }
        }
        else
        {
          result = newResult;
        }

        if (list[i] === item || i !== 1)
        {
          i += d;
        }
      }

      return result;
    });
  }

  function handleListIsEqual<R>(
    list: any[],
    context: LiveContext, 
    params: Record<'list' | 'isEqual', LiveCommand>, 
    scope: Record<'list' | 'value' | 'test', string>, 
    value: any, 
    start: (n: number) => number,
    end: (n: number) => number,
    handleMatch: (current: any, index: number, list: any[]) => R | undefined,
    getDefaultResult: (list: any[]) => R
  ): R
  {
    return preserveScope(run, context, [scope.list, scope.value, scope.test], () => 
    {
      const n = list.length;
      let i = start(n);
      const e = end(n);
      const d = i < e ? 1 : -1;

      while (i !== e)
      {
        const test = list[i];
        const next = list[i + d];

        run.dataSet(context, scope.list, list);
        run.dataSet(context, scope.value, value);
        run.dataSet(context, scope.test, test);

        if (params.isEqual(context)) 
        {
          const matchResult = handleMatch(test, i, list);

          if (matchResult !== undefined)
          {
            return matchResult;
          }
          else if (list[i] === next)
          {
            i -= d;
          }
        }

        i += d;
      }

      return getDefaultResult(list);
    });
  }

}
