// import { describe, it, expect } from 'jest';

import { addBackwardsCompatibility, Exprs, NumberOps } from 'expangine-runtime';
import { LiveRuntime } from '../src';


// tslint:disable: no-magic-numbers

describe('for', () => {

  addBackwardsCompatibility(LiveRuntime.defs);

  it('defaults', () =>
  {
    const code = Exprs.for('i', 0, 3, 
      Exprs.get('x').set(
        Exprs.op(NumberOps.add, {
          value: Exprs.get('x'), 
          addend: 1 
        })
      )
    );
    
    const program = LiveRuntime.getCommand(code);
    const data = { x: 0 };

    program(data);

    expect(data.x).toEqual(3);
  });

  it('by', () =>
  {
    const code = Exprs.for('i', 0, 3, 
      Exprs.get('x').set(
        Exprs.op(NumberOps.add, {
          value: Exprs.get('x'), 
          addend: 1 
        })
      )
    , 2);
    
    const program = LiveRuntime.getCommand(code);
    const data = { x: 0 };

    program(data);

    expect(data.x).toEqual(2);
  });

  it('dynamic by', () =>
  {
    const code = Exprs.for('i', 0, 10, 
      Exprs.get('x').set(
        Exprs.op(NumberOps.add, {
          value: Exprs.get('x'), 
          addend: 1,
        })
      ),
      Exprs.op(NumberOps.add, {
        value: Exprs.op(NumberOps.mod, {
          value: Exprs.get('x'),
          divisor: 2
        }),
        addend: 1,
      })
    );
    
    // i=0, x=1
    // i=2, x=2
    // i=3, x=3
    // i=5, x=4
    // i=6, x=5
    // i=8, x=6
    // i=9, x=7

    const program = LiveRuntime.getCommand(code);
    const data = { x: 0 };

    program(data);

    expect(data.x).toEqual(7);
  });

});