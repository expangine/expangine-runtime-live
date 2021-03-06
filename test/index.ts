// import { describe, it, expect } from 'jest';

import { ListOps, NumberType, TextType, OptionalType, BooleanType, DateType, MapType, OperationExpression, ConstantExpression, Exprs, NumberOps, Types, addBackwardsCompatibility } from 'expangine-runtime';
import { LiveRuntime } from '../src';


// tslint:disable: no-magic-numbers

describe('index', () => {

  addBackwardsCompatibility(LiveRuntime.defs);

  it('has test', () =>
  {
    const processor = LiveRuntime.eval(['op', 'num:+', {
      value: ['get', ['a']],
      addend: ['if', [  
        [['get', ['b']], 2 ] // if b <> 0, 2
      ], 10]
    }])

    const a = processor({
      a: 2,
      b: 3
    }); // 4

    expect(a).toEqual(4);

    const b = processor({
      a: 2,
      b: 0
    }); // 12

    expect(b).toEqual(12);
  });

  it('do', () => {
    // do { a = a + 1 } while (a < 10)
    const test = LiveRuntime.eval(['do',
      ['op', 'num:<', {
        value: ['get', ['a']],
        test: 10
      }],
      ['set', ['a'], ['op', 'num:+', {
        value: ['get', ['a']],
        addend: 1
      }]]
    ]);

    const ctx = { a: 2 };

    test(ctx);

    expect(ctx.a).toEqual(10);
  });

  it('do break', () => {
    // do { a = a + 1; if (a == 4) break; } while (a < 10)
    const test = LiveRuntime.eval(['do',
      ['op', 'num:<', {
        value: ['get', ['a']],
        test: 10
      }],
      ['chain', [
        ['set', ['a'], ['op', 'num:+', {
          value: ['get', ['a']],
          addend: 1
        }]],
        ['if', [
          [
            ['op', 'num:=', {
              value: ['get', ['a']],
              test: 4
            }],
            ['flow', 'break'],
          ],
        ]],
      ]],
    ]);

    const ctx = { a: 2 };

    test(ctx);

    expect(ctx.a).toEqual(4);
  });

  it('while', () => {
    // while (a < 10) { a = a + 1; }
    const test = LiveRuntime.eval(['while',
      ['op', 'num:<', {
        value: ['get', ['a']],
        test: 10
      }],
      ['set', ['a'], ['op', 'num:+', {
        value: ['get', ['a']],
        addend: 1
      }]]
    ]);

    const ctx = { a: 2 };

    test(ctx);

    expect(ctx.a).toEqual(10);
  });

  it('while break', () => {
    // while (a < 10) { a = a + 1; if (a == 4) break; }
    const test = LiveRuntime.eval(['while',
      ['op', 'num:<', {
        value: ['get', ['a']],
        test: 10
      }],
      ['chain', [
        ['set', ['a'], ['op', 'num:+', {
          value: ['get', ['a']],
          addend: 1
        }]],
        ['if', [
          [['op', 'num:=', {
            value: ['get', ['a']],
            test: 4
          }],
          ['flow', 'break']],
        ]],
      ]],
    ]);

    const ctx = { a: 2 };

    test(ctx);

    expect(ctx.a).toEqual(4);
  });

  it('template', () => {

    const injector = LiveRuntime.eval(['tmpl', '/user/{user_id}/post/{post_id}', {
      user_id: ['get', ['user_id']],
      post_id: 12
    }]);

    expect(injector({
      user_id: 24
    })).toEqual('/user/24/post/12');
  });

  it('update', () => {

    const process = LiveRuntime.eval(['up', [['get'], 'x'], ['op', 'num:*', {
      value: ['path', [['get'], 'current']],
      multiplier: 2
    }]]);

    const context = {
      x: 4
    };

    process(context);

    expect(context.x).toEqual(8);

  });

  it('functions', () =>
  {
    LiveRuntime.defs.addFunction({
      name: 'timesTwo',
      params: Types.object({
        x: NumberType,
      }),
      expression: ['return', 
        ['op', 'num:*', {
          value: ['get', ['x']],
          multiplier: 2
        }]
      ]
    });

    const process = LiveRuntime.eval(['invoke', 'timesTwo', {
      x: 3
    }]);

    const context = {
      x: 4
    };
    
    const result = process(context);

    expect(result).toEqual(6);
  });

  it('functions early exit', () =>
  {
    LiveRuntime.defs.addFunction({
      name: 'isEven', 
      params: Types.object({ x: NumberType }), 
      expression: ['chain', [
        ['if', [
          [['op', 'num:%?', { value: ['get', ['x']], by: 2 }], 
            ['return', true]]
        ]],
        ['return', false]
      ]],
    });

    const process = LiveRuntime.eval(['invoke', 'isEven', {
      x: ['get', ['x']]
    }]);

    expect(process({x: 0})).toStrictEqual(true);
    expect(process({x: 1})).toStrictEqual(false);
    expect(process({x: 2})).toStrictEqual(true);
    expect(process({x: 3})).toStrictEqual(false);
    expect(process({x: 4})).toStrictEqual(true);
  });

  it('functions early exit with builder', () =>
  {
    LiveRuntime.defs.addFunction({
      name: 'isEven', 
      params: Types.object({ x: NumberType }), 
      expression: Exprs.body(
        Exprs.if(Exprs.op(NumberOps.isDivisible, {
            value: Exprs.get('x'),
            by: 2 }))
          .than(
            Exprs.return(true
          )),
        Exprs.return(false),
      ),
    });

    const process = LiveRuntime.eval(['invoke', 'isEven', {
      x: ['get', ['x']]
    }]);

    expect(process({x: 0})).toStrictEqual(true);
    expect(process({x: 1})).toStrictEqual(false);
    expect(process({x: 2})).toStrictEqual(true);
    expect(process({x: 3})).toStrictEqual(false);
    expect(process({x: 4})).toStrictEqual(true);
  });

  it('tofromJson', () => 
  {
    const type = Types.object({
      a: TextType.baseType,
      b: NumberType.baseType,
      c: new OptionalType(BooleanType.baseType),
      d: DateType.baseType,
      e: new MapType({ key: TextType.baseType, value: NumberType.baseType }),
    });

    const data = {
      a: 'hello',
      b: 123,
      d: new Date(Date.UTC(1989, 0, 3, 0, 0, 0, 0)),
      e: new Map([['a', 45], ['b', 67]]),
    };

    const json = type.toJson(data);

    expect(json).toEqual({
      a: 'hello',
      b: 123,
      d: '1989-01-03T00:00:00.000Z',
      e: [['a', 45], ['b', 67]],
    });

    const value = type.fromJson(json);

    expect(value).toEqual(data);
  });

  it('enum validate', () => 
  {
    const type = LiveRuntime.defs.getType(['enum', 'text', 'num', [
      ['Male', 1],
      ['Female', 2],
      ['Unknown', 3],
    ]]);

    expect(type.isValid(0)).toBeFalsy();
    expect(type.isValid(1)).toBeTruthy();
    expect(type.isValid(2)).toBeTruthy();
    expect(type.isValid(3)).toBeTruthy();
    expect(type.isValid(4)).toBeFalsy();
  });

  it('create op', () =>
  {
    OperationExpression.create(ListOps.copy, {
      list: new ConstantExpression([]),
      deepCopy: new ConstantExpression(0),
    }, {
      copy: 'cc'
    });
  });

  it('switch', () => 
  {
    const code = Exprs
      .switch(Exprs.get('value'), NumberOps.isEqual)
        .case(1)
        .case(2)
        .case(Exprs.get('other'))
          .than('a')
        .case(3)
          .than('b')
        .default('c')
    ;

    const program = LiveRuntime.getCommand(code);

    expect(program({value: 0, other: 4})).toEqual('c');
    expect(program({value: 1, other: 4})).toEqual('a');
    expect(program({value: 2, other: 4})).toEqual('a');
    expect(program({value: 3, other: 4})).toEqual('b');
    expect(program({value: 4, other: 4})).toEqual('a');
    expect(program({value: 5, other: 4})).toEqual('c');
    expect(program({value: 5, other: 5})).toEqual('a');
  });

  it('sub', () => 
  {
    const code = Exprs.sub(
      Exprs.object({
        x: Exprs.const({y: 4})
      }), 
      'x', 
      'y'
    );

    const program = LiveRuntime.getCommand(code);

    expect(program({})).toEqual(4);
  });

  it('assert empty', () => 
  {
    const context = {
      x: 4,
    };

    const cmd = LiveRuntime.getCommand(
      Exprs.assert(Exprs.op(NumberOps.isDivisible, {
        value: Exprs.get('x'),
        by: 3.
      }))
    );

    const result = cmd(context);

    expect(result).toBeUndefined();
    expect(context[LiveRuntime.flowProperty]).toEqual([
      'exit',
      undefined
    ]);
  });

  it('assert constant', () => 
  {
    const context = {
      x: 4,
    };

    const cmd = LiveRuntime.getCommand(
      Exprs.assert(Exprs.op(NumberOps.isDivisible, {
        value: Exprs.get('x'),
        by: 3.
      }), 'NO!')
    );

    const result = cmd(context);

    expect(result).toBeUndefined();
    expect(context[LiveRuntime.flowProperty]).toEqual([
      'exit',
      'NO!'
    ]);
  });

  it('assert template', () => 
  {
    const context = {
      x: 4,
    };

    const cmd = LiveRuntime.getCommand(
      Exprs.assert(Exprs.op(NumberOps.isDivisible, {
        value: Exprs.get('x'),
        by: 3.
      }), Exprs.template('{x} must be divisible by 3', {
        x: Exprs.get('x'),
      }))
    );

    const result = cmd(context);

    expect(result).toBeUndefined();
    expect(context[LiveRuntime.flowProperty]).toEqual([
      'exit',
      '4 must be divisible by 3'
    ]);
  });

  it('destructure', () => 
  {
    const context = {
      x: 4,
      y: { z: 5, w: true },
    };

    const cmd = LiveRuntime.getCommand(
      Exprs.define([
        ['x1', Exprs.get('x')],
        [{ z: 'z', w1: 'w' }, Exprs.get('y')],
      ]).run(
        Exprs.tuple(
          Exprs.get('z'),
          Exprs.get('x1'),
          Exprs.get('w1'),
        ),
      ),
    );

    const result = cmd(context);

    expect(result).toStrictEqual([5, 4, true]);
  });

});
