// import { describe, it, expect } from 'jest';

import { LiveRuntime } from '../src';


// tslint:disable: no-magic-numbers

describe('index', () => {

  it('has test', () =>
  {
    const ops = LiveRuntime.defs.getOperations();

    expect(ops.length).toBeGreaterThan(0);

    for (const { op } of ops)
    {
      const defined = LiveRuntime.ops[op.id];
      if (!defined)
      {
        console.log('operation not defined', op.id);
      }

      expect(defined).toBeDefined();
    }
  });

});