// import { describe, it, expect } from 'jest';

import { ExpressionBuilder, NumberOps } from 'expangine-runtime';
import { LiveRuntime } from '../src';


// tslint:disable: no-magic-numbers

describe('text', () => {

  it('toPercent', () =>
  {
    const ex = new ExpressionBuilder();

    const code = ex.op(NumberOps.toPercent, {
      value: ex.get('value'),
    });

    const program = LiveRuntime.getCommand(code);

    expect(program({value: 1})).toEqual('100%');
    expect(program({value: 0.5})).toEqual('50%');
  });

  it('toPercentMinPlaces', () =>
  {
    const ex = new ExpressionBuilder();

    const code = ex.op(NumberOps.toPercent, {
      value: ex.get('value'),
      minPlaces: ex.const(2),
    });

    const program = LiveRuntime.getCommand(code);

    expect(program({value: 1})).toEqual('100.00%');
    expect(program({value: 0.5})).toEqual('50.00%');
  });

  it('toPercentMaxPlaces', () =>
  {
    const ex = new ExpressionBuilder();

    const code = ex.op(NumberOps.toPercent, {
      value: ex.get('value'),
      maxPlaces: ex.const(2),
    });

    const program = LiveRuntime.getCommand(code);

    expect(program({value: 1.00345})).toEqual('100.34%');
    expect(program({value: 0.506789})).toEqual('50.68%');
  });

  it('fromPercent', () =>
  {
    const ex = new ExpressionBuilder();

    const code = ex.op(NumberOps.fromPercent, { value: ex.get('value') });

    const program = LiveRuntime.getCommand(code);

    expect(program({value: '100'})).toEqual(1);
    expect(program({value: '100%'})).toEqual(1);
    expect(program({value: '50%'})).toEqual(0.5);
  });

});