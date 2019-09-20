
import { LiveRuntime } from '../src';


// tslint:disable: no-magic-numbers

describe('tuple', () => {

  it('isValid', () =>
  {
    const type = LiveRuntime.defs.getType(['tuple', ['text', 'num']]);
    
    expect(type.isValid(['a', 32])).toBeTruthy();
    expect(type.isValid(['a', 32, true])).toBeTruthy();
    expect(type.isValid([34, 'a', true])).toBeFalsy();
    expect(type.isValid(['a'])).toBeFalsy();
  });

});