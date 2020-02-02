// import { describe, it, expect } from 'jest';

import { ExpressionBuilder, TextOps } from 'expangine-runtime';
import { LiveRuntime } from '../src';


// tslint:disable: no-magic-numbers

describe('text', () => {

  it('metaphone', () =>
  {
    const ex = new ExpressionBuilder();

    const code = ex.op(TextOps.metaphone, {
      value: ex.get('input')
    });

    const program = LiveRuntime.getCommand(code);

    expect(program({input: 'Philip Diffenderfer'})).toEqual('FLPTFNTRFR');
  });

  it('toUpper', () =>
  {
    const ex = new ExpressionBuilder();

    const code = ex.computed('text:toUpper', ex.get('value'));

    const program = LiveRuntime.getCommand(code);

    expect(program({value: 'Phil'})).toEqual('PHIL');
  });

  it('asNumber', () =>
  {
    const ex = new ExpressionBuilder();

    const code = ex.op(TextOps.asNumber, { value: ex.get('value') });

    const program = LiveRuntime.getCommand(code);

    expect(program({value: '100'})).toEqual(100);
    expect(program({value: '100%'})).toEqual(100);
    expect(program({value: '$1,100'})).toEqual(1100);
    expect(program({value: '$2,100.25'})).toEqual(2100.25);
  });

});