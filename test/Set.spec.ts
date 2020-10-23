// import { describe, it, expect } from 'jest';

import { addBackwardsCompatibility, Exprs } from 'expangine-runtime';
import { LiveRuntime } from '../src';


// tslint:disable: no-magic-numbers

describe('set', () => {

  addBackwardsCompatibility(LiveRuntime.defs);

  it('set simple', () =>
  {
    const code = Exprs.set(Exprs.get(), 'x').to(4);
    const program = LiveRuntime.getCommand(code);
    const context = { x: 3 };
    
    program(context);

    expect(context.x).toEqual(4);
  });

  it('set undefined', () =>
  {
    const code = Exprs.set(Exprs.get(), 'y').to(5);
    const program = LiveRuntime.getCommand(code);
    const context: any = { x: 3 };

    program(context);

    expect(context.y).toEqual(5);
  });

  it('set sub null', () =>
  {
    const code = Exprs.set(Exprs.get(), 'x', 'y').to(null);
    const program = LiveRuntime.getCommand(code);
    const context = { x: 4 };

    program(context);

    expect(context.x).toEqual(4);
  });

  it('set map', () =>
  {
    const code = Exprs.set(Exprs.get(), 'x', 'w').to(44);
    const program = LiveRuntime.getCommand(code);
    const context = { x: new Map([['w', 4]]) };

    program(context);

    expect(context.x.get('w')).toEqual(44);
  });

  it('set map undefined', () =>
  {
    const code = Exprs.set(Exprs.get(), 'x', 'w').to(44);
    const program = LiveRuntime.getCommand(code);
    const context = { x: new Map([['y', 4]]) };

    program(context);

    expect(context.x.get('w')).toEqual(44);
  });

  it('set map sub', () =>
  {
    const code = Exprs.set(Exprs.get(), 'x', 'w', 'z').to(44);
    const program = LiveRuntime.getCommand(code);
    const context = { x: new Map([['w', 4]]) };

    program(context);

    expect(context.x.get('w')).toEqual(4);
  });

});