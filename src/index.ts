export * from './LiveRuntime';

import { LiveRuntime } from './LiveRuntime';
import { default as addLiveExpressions } from './xExpressions';
import { default as addLiveEntity } from './Entity';
import { default as addLiveAny } from './xAny';
import { default as addLiveBoolean } from './Boolean';
import { default as addLiveColor } from './Color';
import { default as addLiveDate } from './Date';
import { default as addLiveList } from './xList';
import { default as addLiveMap } from './xMap';
import { default as addLiveNumber } from './Number';
import { default as addLiveObject } from './xObject';
import { default as addLiveSet } from './Set';
import { default as addLiveText } from './xText';
import { default as addLiveTuple } from './Tuple';


addLiveExpressions(LiveRuntime);
addLiveEntity(LiveRuntime);
addLiveAny(LiveRuntime);
addLiveBoolean(LiveRuntime);
addLiveColor(LiveRuntime);
addLiveDate(LiveRuntime);
addLiveList(LiveRuntime);
addLiveMap(LiveRuntime);
addLiveNumber(LiveRuntime);
addLiveObject(LiveRuntime);
addLiveSet(LiveRuntime);
addLiveText(LiveRuntime);
addLiveTuple(LiveRuntime);


export {
  addLiveExpressions,
  addLiveAny,
  addLiveEntity,
  addLiveBoolean,
  addLiveColor,
  addLiveDate,
  addLiveList,
  addLiveMap,
  addLiveNumber,
  addLiveObject,
  addLiveSet,
  addLiveText,
  addLiveTuple,
};