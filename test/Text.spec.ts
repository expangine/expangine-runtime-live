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

});