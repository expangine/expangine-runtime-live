export * from './LiveRuntime';

import { LiveRuntime } from './LiveRuntime';
import { default as addLiveExpressions } from './Expressions';
import { default as addLiveAny } from './Any';
import { default as addLiveBoolean } from './Boolean';
import { default as addLiveColor } from './Color';
import { default as addLiveDate } from './Date';
import { default as addLiveList } from './List';
import { default as addLiveMap } from './Map';
import { default as addLiveNumber } from './Number';
import { default as addLiveObject } from './Object';
import { default as addLiveText } from './Text';
import { default as addLiveTuple } from './Tuple';


addLiveExpressions(LiveRuntime);
addLiveAny(LiveRuntime);
addLiveBoolean(LiveRuntime);
addLiveColor(LiveRuntime);
addLiveDate(LiveRuntime);
addLiveList(LiveRuntime);
addLiveMap(LiveRuntime);
addLiveNumber(LiveRuntime);
addLiveObject(LiveRuntime);
addLiveText(LiveRuntime);
addLiveTuple(LiveRuntime);


export {
  addLiveExpressions,
  addLiveAny,
  addLiveBoolean,
  addLiveColor,
  addLiveDate,
  addLiveList,
  addLiveMap,
  addLiveNumber,
  addLiveObject,
  addLiveText,
  addLiveTuple,
};