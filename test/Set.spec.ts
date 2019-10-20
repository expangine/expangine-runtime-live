// import { describe, it, expect } from 'jest';

import { ExpressionBuilder } from 'expangine-runtime';
import { LiveRuntime } from '../src';


// tslint:disable: no-magic-numbers

describe('set', () => {

  it('set simple', () =>
  {
    const ex = new ExpressionBuilder();

    const code = ex.set('x').to(4);
    const program = LiveRuntime.getCommand(code);
    const context = { x: 3 };
    
    program(context);

    expect(context.x).toEqual(4);
  });

  it('set undefined', () =>
  {
    const ex = new ExpressionBuilder();

    const code = ex.set('y').to(5);
    const program = LiveRuntime.getCommand(code);
    const context: any = { x: 3 };

    program(context);

    expect(context.y).toEqual(5);
  });

  it('set sub null', () =>
  {
    const ex = new ExpressionBuilder();

    const code = ex.set('x', 'y').to(null);
    const program = LiveRuntime.getCommand(code);
    const context = { x: 4 };

    program(context);

    expect(context.x).toEqual(4);
  });

  it('set map', () =>
  {
    const ex = new ExpressionBuilder();

    const code = ex.set('x', 'w').to(44);
    const program = LiveRuntime.getCommand(code);
    const context = { x: new Map([['w', 4]]) };

    program(context);

    expect(context.x.get('w')).toEqual(44);
  });

  it('set map undefined', () =>
  {
    const ex = new ExpressionBuilder();

    const code = ex.set('x', 'w').to(44);
    const program = LiveRuntime.getCommand(code);
    const context = { x: new Map([['y', 4]]) };

    program(context);

    expect(context.x.get('w')).toEqual(44);
  });

  it('set map sub', () =>
  {
    const ex = new ExpressionBuilder();

    const code = ex.set('x', 'w', 'z').to(44);
    const program = LiveRuntime.getCommand(code);
    const context = { x: new Map([['w', 4]]) };

    program(context);

    expect(context.x.get('w')).toEqual(4);
  });

});