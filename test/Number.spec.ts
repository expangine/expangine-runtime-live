// import { describe, it, expect } from 'jest';

import { addBackwardsCompatibility, Exprs, NumberOps } from 'expangine-runtime';
import { LiveRuntime } from '../src';


// tslint:disable: no-magic-numbers

describe('text', () => {

  addBackwardsCompatibility(LiveRuntime.defs);

  it('toPercent', () =>
  {
    const code = Exprs.op(NumberOps.toPercent, {
      value: Exprs.get('value'),
    });

    const program = LiveRuntime.getCommand(code);

    expect(program({value: 1})).toEqual('100%');
    expect(program({value: 0.5})).toEqual('50%');
  });

  it('toPercentMinPlaces', () =>
  {
    const code = Exprs.op(NumberOps.toPercent, {
      value: Exprs.get('value'),
      minPlaces: Exprs.const(2),
    });

    const program = LiveRuntime.getCommand(code);

    expect(program({value: 1})).toEqual('100.00%');
    expect(program({value: 0.5})).toEqual('50.00%');
  });

  it('toPercentMaxPlaces', () =>
  {
    const code = Exprs.op(NumberOps.toPercent, {
      value: Exprs.get('value'),
      maxPlaces: Exprs.const(2),
    });

    const program = LiveRuntime.getCommand(code);

    expect(program({value: 1.00345})).toEqual('100.34%');
    expect(program({value: 0.506789})).toEqual('50.68%');
  });

  it('fromPercent', () =>
  {
    const code = Exprs.op(NumberOps.fromPercent, { value: Exprs.get('value') });

    const program = LiveRuntime.getCommand(code);

    expect(program({value: '100'})).toEqual(1);
    expect(program({value: '100%'})).toEqual(1);
    expect(program({value: '50%'})).toEqual(0.5);
  });

});