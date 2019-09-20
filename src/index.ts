export * from './runtime';

import { LiveRuntime } from './runtime';
import { default as addLiveExpressions } from './expressions';
import { default as addLiveAny } from './any';
import { default as addLiveBoolean } from './boolean';
import { default as addLiveDate } from './date';
import { default as addLiveList } from './list';
import { default as addLiveMap } from './map';
import { default as addLiveNumber } from './number';
import { default as addLiveObject } from './object';
import { default as addLiveText } from './text';
import { default as addLiveTuple } from './tuple';


addLiveExpressions(LiveRuntime);
addLiveAny(LiveRuntime);
addLiveBoolean(LiveRuntime);
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
  addLiveDate,
  addLiveList,
  addLiveMap,
  addLiveNumber,
  addLiveObject,
  addLiveText,
  addLiveTuple,
};