// import { describe, it, expect } from 'jest';

import { Exprs, Types, NumberOps, Expression, FuncOptions } from 'expangine-runtime';
import { LiveRuntime } from '../src';


// tslint:disable: no-magic-numbers

describe('method', () => {

  LiveRuntime.defs.addEntity({
    name: 'MethodTest',
    type: Types.object({
      x: Types.number(),
      y: Types.number(),
    }),
    methods: {
      magnitude: {
        name: 'magnitude',
        params: Types.object(),
        expression: Exprs.return(
          Exprs.op(NumberOps.sqrt, {
            value: Exprs.op(NumberOps.add, {
              value: Exprs.op(NumberOps.sq, {
                value: Exprs.get(Expression.INSTANCE, 'x'),
              }),
              addend: Exprs.op(NumberOps.sq, {
                value: Exprs.get(Expression.INSTANCE, 'y'),
              }),
            })
          }),
        ),
      } as unknown as FuncOptions,
      distance: {
        name: 'distance',
        params: Types.object({
          other: Types.entity('MethodTest', LiveRuntime.defs),
        }),
        expression: Exprs.define({
          dx: Exprs.op(NumberOps.sub, {
            value: Exprs.get(Expression.INSTANCE, 'x'),
            subtrahend: Exprs.get('other', 'x'),
          }),
          dy: Exprs.op(NumberOps.sub, {
            value: Exprs.get(Expression.INSTANCE, 'y'),
            subtrahend: Exprs.get('other', 'y'),
          }),
        },
          Exprs.return(
            Exprs.op(NumberOps.sqrt, {
              value: Exprs.op(NumberOps.add, {
                value: Exprs.op(NumberOps.sq, {
                  value: Exprs.get('dx'),
                }),
                addend: Exprs.op(NumberOps.sq, {
                  value: Exprs.get('dy'),
                }),
              })
            }),
          ),
        ),
        
        
      } as unknown as FuncOptions,
    },
  });

  it('method noargs', () =>
  {
    const code = Exprs.get('a', Exprs.method('MethodTest', 'magnitude'));
    const program = LiveRuntime.getCommand(code);

    const context = { a: { x: 4, y: 0 } };
    
    const result = program(context);

    expect(result).toEqual(4);
  });

  it('method args', () =>
  {
    const code = Exprs.get('a', Exprs.method('MethodTest', 'distance', {
      other: Exprs.get('b'),
    }));
    const program = LiveRuntime.getCommand(code);

    const context = { a: { x: 4, y: 0 }, b: { x: -4, y: 0 } };
    
    const result = program(context);

    debugger;

    expect(result).toEqual(8);
  });

});