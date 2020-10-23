import { Types, defs, Exprs, addBackwardsCompatibility } from 'expangine-runtime';
import { LiveRuntime } from '../src';


describe('Data', () => {

  addBackwardsCompatibility(LiveRuntime.defs);

  defs.addData({
    name: 'bigData',
    dataType: Types.list(Types.object({name: Types.text()})),
    data: [
      { name: 'a' },
      { name: 'b' },
    ],
  });

  it('get root', () =>
  {
    const result = LiveRuntime.run(
      Exprs.data('bigData'),
    {});

    expect(result).toEqual([
      { name: 'a' },
      { name: 'b' },
    ]);
  });

  it('get sub', () =>
  {
    const result = LiveRuntime.run(
      Exprs.sub(Exprs.data('bigData'), 0, 'name'),
    {});

    expect(result).toEqual('a');
  });

});