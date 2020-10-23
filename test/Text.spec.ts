// import { describe, it, expect } from 'jest';

import { addBackwardsCompatibility, Exprs, TextOps } from 'expangine-runtime';
import { LiveRuntime } from '../src';


// tslint:disable: no-magic-numbers

describe('text', () => {

  addBackwardsCompatibility(LiveRuntime.defs);

  it('metaphone', () =>
  {
    const code = Exprs.op(TextOps.metaphone, {
      value: Exprs.get('input')
    });

    const program = LiveRuntime.getCommand(code);

    expect(program({input: 'Philip Diffenderfer'})).toEqual('FLPTFNTRFR');
  });

  it('toUpper', () =>
  {
    const code = Exprs.get('value', Exprs.computed('text:toUpper'));

    const program = LiveRuntime.getCommand(code);

    expect(program({value: 'Phil'})).toEqual('PHIL');
  });

  it('asNumber', () =>
  {
    const code = Exprs.op(TextOps.asNumber, { value: Exprs.get('value') });

    const program = LiveRuntime.getCommand(code);

    expect(program({value: '100'})).toEqual(100);
    expect(program({value: '100%'})).toEqual(100);
    expect(program({value: '$1,100'})).toEqual(1100);
    expect(program({value: '$2,100.25'})).toEqual(2100.25);
  });

});