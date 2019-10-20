// import { describe, it, expect } from 'jest';

import { ExpressionBuilder } from 'expangine-runtime';
import { LiveRuntime } from '../src';


// tslint:disable: no-magic-numbers

describe('get', () => {

  it('get simple', () =>
  {
    const ex = new ExpressionBuilder();

    const code = ex.get('x');
    const program = LiveRuntime.getCommand(code);

    expect(program({x: 3})).toEqual(3);
  });

  it('get undefined', () =>
  {
    const ex = new ExpressionBuilder();

    const code = ex.get('y');
    const program = LiveRuntime.getCommand(code);

    expect(program({x: 3})).toEqual(undefined);
  });

  it('get null', () =>
  {
    const ex = new ExpressionBuilder();

    const code = ex.get('x');
    const program = LiveRuntime.getCommand(code);

    expect(program({x: null})).toEqual(null);
  });

  it('get sub null', () =>
  {
    const ex = new ExpressionBuilder();

    const code = ex.get('x', 'w');
    const program = LiveRuntime.getCommand(code);

    expect(program({x: null})).toEqual(undefined);
  });

  it('get map', () =>
  {
    const ex = new ExpressionBuilder();

    const code = ex.get('x', 'w');
    const program = LiveRuntime.getCommand(code);

    expect(program({x: new Map([['w', 4]])})).toEqual(4);
  });

});