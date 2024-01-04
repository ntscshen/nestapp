import { isNil } from 'lodash';
import { ObjectLiteral, SelectQueryBuilder } from 'typeorm';

import { PaginateOptions, PaginateReturn } from './types';

/**
 * 分页函数
 * @param qb queryBuilder实例
 * @param options 分页选项
 * 场景: 从数据库动态获取分页数据时使用
 */
export const paginate = async <E extends ObjectLiteral>(
    qb: SelectQueryBuilder<E>,
    options: PaginateOptions,
): Promise<PaginateReturn<E>> => {
    // 计算真实Limit和Page
    const limit = isNil(options.limit) || options.limit < 1 ? 1 : options.limit;
    const page = isNil(options.page) || options.page < 1 ? 1 : options.page;

    const start = page >= 1 ? page - 1 : 0;
    const totalItems = await qb.getCount();
    qb.take(limit).skip(start * limit);
    const items = await qb.getMany();
    const totalPages =
        totalItems % limit === 0
            ? Math.floor(totalItems / limit)
            : Math.floor(totalItems / limit) + 1;
    const remainder = totalItems % limit !== 0 ? totalItems % limit : limit;
    const itemCount = page < totalPages ? limit : remainder;
    return {
        items,
        meta: {
            totalItems,
            itemCount,
            perPage: limit,
            totalPages,
            currentPage: page,
        },
    };
};

/**
 * 简单的分页函数
 * @param options 分页选项
 * @param data 数据列表
 * 场景: 一个完全加载到内存中的数据集，对其进行客户端分页时使用
 */
export const treePaginate = <E extends ObjectLiteral>(
    options: PaginateOptions,
    data: E[],
): PaginateReturn<E> => {
    const { page = 1, limit = 10 } = options;
    let items: E[] = [];
    const totalItems = data.length;
    const rawTotalPages = totalItems / limit;
    const totalPages = Math.ceil(rawTotalPages);
    const itemCount = page <= totalPages ? limit : totalItems % limit || limit;
    if (page <= totalPages) {
        const startIndex = (page - 1) * limit;
        const endIndex = page === totalPages ? totalItems : startIndex + limit;
        items = data.slice(startIndex, endIndex);
    }
    return {
        meta: {
            itemCount, // 当前页的项数(最后一页可能少于 limit)
            totalItems,
            perPage: limit, // 每页期望展示的项数。per每
            totalPages,
            currentPage: page,
        },
        items,
    };
};
