// import { describe, it, expect } from 'jest';

import { Exprs, NumberOps } from 'expangine-runtime';
import { LiveRuntime } from '../src';


// tslint:disable: no-magic-numbers

describe('update', () => {

  it('update simple', () =>
  {
    const code = Exprs.update('x').to(4);
    const program = LiveRuntime.getCommand(code);
    const context = { x: 3 };
    
    program(context);

    expect(context.x).toEqual(4);
  });

  it('update simple scoped', () =>
  {
    const code = Exprs.update('x').to(Exprs.op(NumberOps.mul, {
      value: Exprs.get('current'),
      multiplier: 2
    }));
    const program = LiveRuntime.getCommand(code);
    const context = { x: 3 };
    
    program(context);

    expect(context.x).toEqual(6);
  });

  it('update undefined', () =>
  {
    const code = Exprs.update('y').to(Exprs.op(NumberOps.mul, {
      value: Exprs.get('current'),
      multiplier: 2
    }));
    const program = LiveRuntime.getCommand(code);
    const context: any = { x: 3 };

    program(context);

    expect(context.y).toEqual(NaN);
  });

  it('update sub null', () =>
  {
    const code = Exprs.update('x', 'y').to(Exprs.op(NumberOps.mul, {
      value: Exprs.get('current'),
      multiplier: 2
    }));
    const program = LiveRuntime.getCommand(code);
    const context = { x: 4 };

    program(context);

    expect(context.x).toEqual(4);
  });

  it('update map', () =>
  {
    const code = Exprs.update('x', 'w').to(Exprs.op(NumberOps.mul, {
      value: Exprs.get('current'),
      multiplier: 2
    }));
    const program = LiveRuntime.getCommand(code);
    const context = { x: new Map([['w', 4]]) };

    program(context);

    expect(context.x.get('w')).toEqual(8);
  });

  it('update map undefined', () =>
  {
    const code = Exprs.set('x', 'w').to(Exprs.op(NumberOps.mul, {
      value: Exprs.get('current'),
      multiplier: 2
    }));
    const program = LiveRuntime.getCommand(code);
    const context = { x: new Map([['y', 4]]) };

    program(context);

    expect(context.x.get('w')).toEqual(NaN);
  });

  it('update map sub', () =>
  {
    const code = Exprs.update('x', 'w', 'z').to(Exprs.op(NumberOps.mul, {
      value: Exprs.get('current'),
      multiplier: 2
    }));
    const program = LiveRuntime.getCommand(code);
    const context = { x: new Map([['w', 4]]) };

    program(context);

    expect(context.x.get('w')).toEqual(4);
  });

});