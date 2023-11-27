import { isNil } from 'lodash';

/**
 * 用于请求验证中的 boolean 数据转义
 * */
export function toBoolean(value?: string | boolean): boolean {
    if (isNil(value)) return false;
    if (typeof value === 'boolean') return value;
    try {
        return JSON.parse(value.toLowerCase());
    } catch (error) {
        return value as unknown as boolean;
    }
}

/**
 * 用于请求验证中转义 null
 * */
export function toNull(value?: string | null): string | null | undefined {
    return value === 'null' ? null : value;
}

/**
 * 深度合并对象
 * @param x 初始值
 * @param y 新值
 * @param arrayMode 对于数组采取的策略, 'replace'为直接替换, 'merge'为合并数组
 * */
export const deepMerge = <T1, T2>(
    x: Partial<T1>,
    y: Partial<T2>,
    arrayMode: 'replace' | 'merge' = 'merge',
) => {};

/**
Partial adj.局部的
1. 这里的 Partial<T1> 和 Partial<T2> 是将 T1 和 T2 的所有属性变为可选，
   这意味着 x 和 y 可以是 T1 和 T2 的完整对象，也可以是它们的子集。
2. 'merge' = 'merge'
   = 'merge'：这里的等号（=）用于指定默认值。
   这意味着如果你调用deepMerge函数时没有提供arrayMode参数，那么该参数将自动设为'merge'。
 * */
