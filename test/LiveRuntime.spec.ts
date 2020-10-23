// import { describe, it, expect } from 'jest';

import { addBackwardsCompatibility } from 'expangine-runtime';
import { LiveRuntime } from '../src';


// tslint:disable: no-magic-numbers

describe('index', () => {

  addBackwardsCompatibility(LiveRuntime.defs);

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