import { Color } from 'expangine-runtime';
import { LiveContext, LiveResult, LiveCommand } from './LiveRuntime';
export declare function saveScope<K extends string>(context: LiveContext, scope: Record<string, K>): Record<K, any>;
export declare function restoreScope<K extends string>(context: LiveContext, saved: Record<K, any>): void;
export declare function preserveScope<R = any>(context: LiveContext, props: string[], run: () => R): R;
export declare function _optional(cmd: LiveCommand | undefined, context: LiveContext, defaultValue?: LiveResult): LiveResult;
export declare function _bool(cmd: LiveCommand | undefined, context: LiveContext, defaultValue?: boolean): boolean;
export declare function _typed<T>(isValid: (value: any) => value is T, invalidValueDefault: T): (cmd: LiveCommand, context: LiveContext, invalidValue?: T) => T;
export declare function _typedDynamic<T>(isValid: (value: any) => value is T, invalidValueDefault: () => T): (cmd: LiveCommand, context: LiveContext, invalidValue?: () => T) => T;
export declare const _boolMaybe: (cmd: LiveCommand, context: LiveContext, invalidValue?: boolean) => boolean;
export declare const _number: (cmd: LiveCommand, context: LiveContext, invalidValue?: number) => number;
export declare const _numberMaybe: (cmd: LiveCommand, context: LiveContext, invalidValue?: number) => number;
export declare const _text: (cmd: LiveCommand, context: LiveContext, invalidValue?: string) => string;
export declare const _textMaybe: (cmd: LiveCommand, context: LiveContext, invalidValue?: string) => string;
export declare const _list: (cmd: LiveCommand, context: LiveContext, invalidValue?: () => any[]) => any[];
export declare const _listMaybe: (cmd: LiveCommand, context: LiveContext, invalidValue?: any[]) => any[];
export declare const _map: (cmd: LiveCommand, context: LiveContext, invalidValue?: () => Map<any, any>) => Map<any, any>;
export declare const _mapMaybe: (cmd: LiveCommand, context: LiveContext, invalidValue?: Map<any, any>) => Map<any, any>;
export declare const _set: (cmd: LiveCommand, context: LiveContext, invalidValue?: () => Set<any>) => Set<any>;
export declare const _setMaybe: (cmd: LiveCommand, context: LiveContext, invalidValue?: Set<any>) => Set<any>;
export declare const _object: (cmd: LiveCommand, context: LiveContext, invalidValue?: () => any) => any;
export declare const _objectMaybe: (cmd: LiveCommand, context: LiveContext, invalidValue?: any) => any;
export declare const _color: (cmd: LiveCommand, context: LiveContext, invalidValue?: () => Color) => Color;
export declare const _colorMaybe: (cmd: LiveCommand, context: LiveContext, invalidValue?: any) => any;
export declare const _date: (cmd: LiveCommand, context: LiveContext, invalidValue?: () => Date) => Date;
export declare const _dateMaybe: (cmd: LiveCommand, context: LiveContext, invalidValue?: Date) => Date;
export declare function _asList(getValue: LiveCommand, context: LiveContext): any[];
export declare function _asMap(getValue: LiveCommand, context: LiveContext): Map<string, any>;
export declare function _asObject(getValue: LiveCommand, context: LiveContext): {
    value: any;
};
export declare function _asTuple(getValue: LiveCommand, context: any): any[];
export declare function _asSet(getValue: LiveCommand, context: any): Set<any>;
export declare function _colorOrNumber(getValue: LiveCommand, context: any): Color;
export declare function _regex(getPattern: LiveCommand, context: any, g?: LiveCommand | boolean, i?: LiveCommand | boolean, m?: LiveCommand | boolean): RegExp;
export declare function _regexFlag(flag: LiveCommand | boolean | undefined, context: any, defaultValue?: boolean): boolean;
