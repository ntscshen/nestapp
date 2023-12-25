// 深度合并对象

import deepmerge from 'deepmerge';
import { isNil } from 'lodash';
/**
 * 用于请求验证中的boolean数据转义
 * @param value
 */
export function toBoolean(value?: string | boolean): boolean {
    if (isNil(value)) return false;
    if (typeof value === 'boolean') return value;
    try {
        return JSON.parse(value.toLowerCase());
    } catch (error) {
        return value as unknown as boolean;
    }
}
export const deepMerge = <T1, T2>(
    x: Partial<T1>,
    y: Partial<T2>,
    arrayMode: 'replace' | 'merge' = 'merge',
) => {
    const options: deepmerge.Options = {};
    if (arrayMode === 'replace') {
        options.arrayMerge = (_d, s, _o) => s;
        // 这意味着在合并过程中，当遇到数组类型的属性时，源数组将完全替换目标数组，而不是将它们合并。
    } else if (arrayMode === 'merge') {
        options.arrayMerge = (_d, s, _o) => Array.from(new Set([..._d, ...s]));
        // 使用了扩展运算符 (...) 将目标数组和源数组的元素合并到一个新数组中，
        // 然后通过 new Set() 创建一个集合，从而去除重复的元素。
        // Array.from 用于将 Set 对象转换回数组。
    }
    return deepmerge(x, y, options) as T2 extends T1 ? T1 : T1 & T2;
};

// destinationArray目的地, sourceArray源, options
