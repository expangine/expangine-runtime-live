// import { describe, it, expect } from 'jest';

import { Exprs } from 'expangine-runtime';
import { LiveRuntime } from '../src';


// tslint:disable: no-magic-numbers

describe('computed', () => {

  it('computed simple', () =>
  {
    const code = Exprs.get('a', Exprs.computed('text:toUpper'));
    const program = LiveRuntime.getCommand(code);

    const context = { a: 'aXe' };
    
    const result = program(context);

    expect(result).toEqual('AXE');
  });

});