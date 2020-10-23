// import { describe, it, expect } from 'jest';

import { addBackwardsCompatibility, Exprs, NumberOps } from 'expangine-runtime';
import { LiveRuntime } from '../src';


// tslint:disable: no-magic-numbers

describe('update', () => {

  addBackwardsCompatibility(LiveRuntime.defs);

  it('update simple', () =>
  {
    const code = Exprs.set(Exprs.get(), 'x').to(4);
    const program = LiveRuntime.getCommand(code);
    const context = { x: 3 };
    
    program(context);

    expect(context.x).toEqual(4);
  });

  it('update simple scoped', () =>
  {
    const code = Exprs.set(Exprs.get(), 'x').to(Exprs.op(NumberOps.mul, {
      value: Exprs.get('current'),
      multiplier: 2
    })).withVariable('current');
    const program = LiveRuntime.getCommand(code);
    const context = { x: 3 };
    
    program(context);

    expect(context.x).toEqual(6);
  });

  it('update undefined', () =>
  {
    const code = Exprs.set(Exprs.get(), 'y').to(Exprs.op(NumberOps.mul, {
      value: Exprs.get('current'),
      multiplier: 2
    })).withVariable('current');
    const program = LiveRuntime.getCommand(code);
    const context: any = { x: 3 };

    program(context);

    expect(context.y).toEqual(NaN);
  });

  it('update sub null', () =>
  {
    const code = Exprs.set(Exprs.get(), 'x', 'y').to(Exprs.op(NumberOps.mul, {
      value: Exprs.get('current'),
      multiplier: 2
    })).withVariable('current');
    const program = LiveRuntime.getCommand(code);
    const context = { x: 4 };

    program(context);

    expect(context.x).toEqual(4);
  });

  it('update map', () =>
  {
    const code = Exprs.set(Exprs.get(), 'x', 'w').to(Exprs.op(NumberOps.mul, {
      value: Exprs.get('current'),
      multiplier: 2
    })).withVariable('current');
    const program = LiveRuntime.getCommand(code);
    const context = { x: new Map([['w', 4]]) };

    program(context);

    expect(context.x.get('w')).toEqual(8);
  });

  it('update map undefined', () =>
  {
    const code = Exprs.set(Exprs.get(), 'x', 'w').to(Exprs.op(NumberOps.mul, {
      value: Exprs.get('current'),
      multiplier: 2
    })).withVariable('current');
    const program = LiveRuntime.getCommand(code);
    const context = { x: new Map([['y', 4]]) };

    program(context);

    expect(context.x.get('w')).toEqual(NaN);
  });

  it('update map sub', () =>
  {
    const code = Exprs.set(Exprs.get(), 'x', 'w', 'z').to(Exprs.op(NumberOps.mul, {
      value: Exprs.get('current'),
      multiplier: 2
    })).withVariable('current');
    const program = LiveRuntime.getCommand(code);
    const context = { x: new Map([['w', 4]]) };

    program(context);

    expect(context.x.get('w')).toEqual(4);
  });

});