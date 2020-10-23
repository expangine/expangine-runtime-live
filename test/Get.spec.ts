// import { describe, it, expect } from 'jest';

import { addBackwardsCompatibility, Exprs } from 'expangine-runtime';
import { LiveRuntime } from '../src';


// tslint:disable: no-magic-numbers

describe('get', () => {

  addBackwardsCompatibility(LiveRuntime.defs);

  it('get simple', () =>
  {
    const code = Exprs.get('x');
    const program = LiveRuntime.getCommand(code);

    expect(program({x: 3})).toEqual(3);
  });

  it('get undefined', () =>
  {
    const code = Exprs.get('y');
    const program = LiveRuntime.getCommand(code);

    expect(program({x: 3})).toEqual(undefined);
  });

  it('get null', () =>
  {
    const code = Exprs.get('x');
    const program = LiveRuntime.getCommand(code);

    expect(program({x: null})).toEqual(null);
  });

  it('get sub null', () =>
  {
    const code = Exprs.get('x', 'w');
    const program = LiveRuntime.getCommand(code);

    expect(program({x: null})).toEqual(undefined);
  });

  it('get map', () =>
  {
    const code = Exprs.get('x', 'w');
    const program = LiveRuntime.getCommand(code);

    expect(program({x: new Map([['w', 4]])})).toEqual(4);
  });

});