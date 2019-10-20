// import { describe, it, expect } from 'jest';

import { ExpressionBuilder, NumberOps } from 'expangine-runtime';
import { LiveRuntime } from '../src';


// tslint:disable: no-magic-numbers

describe('update', () => {

  it('update simple', () =>
  {
    const ex = new ExpressionBuilder();

    const code = ex.update('x').to(4);
    const program = LiveRuntime.getCommand(code);
    const context = { x: 3 };
    
    program(context);

    expect(context.x).toEqual(4);
  });

  it('update simple scoped', () =>
  {
    const ex = new ExpressionBuilder();

    const code = ex.update('x').to(ex.op(NumberOps.mul, {
      value: ex.get('current'),
      multiplier: 2
    }));
    const program = LiveRuntime.getCommand(code);
    const context = { x: 3 };
    
    program(context);

    expect(context.x).toEqual(6);
  });

  it('update undefined', () =>
  {
    const ex = new ExpressionBuilder();

    const code = ex.update('y').to(ex.op(NumberOps.mul, {
      value: ex.get('current'),
      multiplier: 2
    }));
    const program = LiveRuntime.getCommand(code);
    const context: any = { x: 3 };

    program(context);

    expect(context.y).toEqual(NaN);
  });

  it('update sub null', () =>
  {
    const ex = new ExpressionBuilder();

    const code = ex.update('x', 'y').to(ex.op(NumberOps.mul, {
      value: ex.get('current'),
      multiplier: 2
    }));
    const program = LiveRuntime.getCommand(code);
    const context = { x: 4 };

    program(context);

    expect(context.x).toEqual(4);
  });

  it('update map', () =>
  {
    const ex = new ExpressionBuilder();

    const code = ex.update('x', 'w').to(ex.op(NumberOps.mul, {
      value: ex.get('current'),
      multiplier: 2
    }));
    const program = LiveRuntime.getCommand(code);
    const context = { x: new Map([['w', 4]]) };

    program(context);

    expect(context.x.get('w')).toEqual(8);
  });

  it('update map undefined', () =>
  {
    const ex = new ExpressionBuilder();

    const code = ex.set('x', 'w').to(ex.op(NumberOps.mul, {
      value: ex.get('current'),
      multiplier: 2
    }));
    const program = LiveRuntime.getCommand(code);
    const context = { x: new Map([['y', 4]]) };

    program(context);

    expect(context.x.get('w')).toEqual(NaN);
  });

  it('update map sub', () =>
  {
    const ex = new ExpressionBuilder();

    const code = ex.update('x', 'w', 'z').to(ex.op(NumberOps.mul, {
      value: ex.get('current'),
      multiplier: 2
    }));
    const program = LiveRuntime.getCommand(code);
    const context = { x: new Map([['w', 4]]) };

    program(context);

    expect(context.x.get('w')).toEqual(4);
  });

});