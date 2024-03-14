import { resolve } from 'path';

import { Type } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EntityClassOrSchema } from '@nestjs/typeorm/dist/interfaces/entity-class-or-schema.type';
import { isNil } from 'lodash';
import {
    DataSource,
    EntitySubscriberInterface,
    ObjectLiteral,
    ObjectType,
    Repository,
    SelectQueryBuilder,
} from 'typeorm';

import { Configure } from '../config/configure';
import { createConnectionOptions } from '../config/helpers';
import { ConfigureFactory, ConfigureRegister } from '../config/types';

import { deepMerge } from '../core/utils';

import { CUSTOM_REPOSITORY_METADATA } from './constants';
import {
    DbConfig,
    DbOptions,
    OrderQueryType,
    PaginateOptions,
    PaginateReturn,
    TypeormOption,
} from './types';

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
        meta: {
            totalItems,
            itemCount,
            perPage: limit,
            totalPages,
            currentPage: page,
        },
        items,
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

/**
 * 为查询添加排序,默认排序规则为DESC
 * @param qb 原查询
 * @param alias 别名
 * @param orderBy 查询排序
 */
export const getOrderByQuery = <E extends ObjectLiteral>(
    qb: SelectQueryBuilder<E>,
    alias: string,
    orderBy?: OrderQueryType,
) => {
    if (isNil(orderBy)) return qb;
    if (typeof orderBy === 'string') return qb.orderBy(`${alias}.${orderBy}`, 'DESC');
    if (Array.isArray(orderBy)) {
        orderBy.forEach((orderItem) => {
            const orderField = typeof orderItem === 'string' ? orderItem : orderItem.name;
            const orderDirection = typeof orderItem === 'string' ? 'DESC' : orderItem.order;
            qb.addOrderBy(`${alias}.${orderField}`, orderDirection);
        });
        return qb;
    }
    return qb.orderBy(`${alias}.${orderBy.name}`, orderBy.order);
};
// 统一处理逻辑，无论 orderBy 是字符串、对象、数组，都通过 addOrder 的辅助函数来统一处理。

/**
 * 数据库配置构造器创建
 * */
export const createDbConfig: (
    register: ConfigureRegister<RePartial<DbConfig>>, // 用于注册或提供数据库配置
) => ConfigureFactory<DbConfig, DbOptions> = (register) => ({
    register,
    hook: (configure, value) => createDbOptions(value),
    defaultRegister: () => ({
        common: {
            charset: 'utf8mb4',
            logging: ['error'],
        },
        connections: [],
    }),
});
/**
 * 创建数据库配置
 * @param options 自定义配置
 */
export const createDbOptions = (options: DbConfig) => {
    const newOptions: DbOptions = {
        common: deepMerge(
            {
                charset: 'utf8mb4',
                logging: ['error'],
                paths: {
                    migration: resolve(__dirname, '../database/migrations'),
                },
            },
            options.common ?? {},
            'replace',
        ),
        connections: createConnectionOptions(options.connections ?? []),
    };
    newOptions.connections = newOptions.connections.map((connection) => {
        const entities = connection.entities ?? [];
        const newOption = { ...connection, entities };
        return deepMerge(
            newOptions.common,
            {
                ...newOption,
                autoLoadEntities: true,
                synchronize: false,
            } as any,
            'replace',
        ) as TypeormOption;
    });
    return newOptions;
};

/**
 * 在模块上注册entity
 * @param configure 配置类实例
 * @param entities entity列表
 * @param dataSource 数据库连接名称，默认为default
 * */
export const addEntities = async (
    configure: Configure,
    entities: EntityClassOrSchema[] = [],
    dataSource = 'default',
) => {
    const database = await configure.get<DbOptions>('database');
    if (isNil(database)) throw new Error(`Typeorm have not any config!`);
    const dbConfig = database.connections.find((item) => item.name === dataSource);
    if (isNil(dbConfig)) throw new Error(`Database connection named ${dataSource} not exists!`);
    const oldEntities = (dbConfig.entities ?? []) as ObjectLiteral[];

    /**
     * 更新数据库配置，添加上新的模型
     * */
    configure.set(
        'database.connections',
        database.connections.map((connection) => {
            return connection.name === dataSource
                ? {
                      ...connection,
                      entities: [...entities, ...oldEntities],
                  }
                : connection;
        }),
    );
    return TypeOrmModule.forFeature(entities, dataSource);
};

/**
 * 在模块上注册订阅者
 * @param configure 配置类实例
 * @param subscribers 订阅者列表
 * @param dataSource 数据库连接名称，默认为default
 * */
export const addSubscribers = async (
    configure: Configure,
    subscribers: Type<any>[] = [],
    dataSource = 'default',
) => {
    const database = await configure.get<DbOptions>('database');
    if (isNil(database)) throw new Error(`Typeorm have not any config!`);
    const dbConfig = database.connections.find((item) => item.name === dataSource);
    if (isNil(dbConfig)) throw new Error(`Database connection named ${dataSource} not exists!`);
    const oldSubscribers = (dbConfig.subscribers ?? []) as EntitySubscriberInterface<any>[];

    /**
     * 更新数据库配置，添加上新的订阅者
     * */
    configure.set(
        'database.connections',
        database.connections.map((connection) => {
            return connection.name === dataSource
                ? {
                      ...connection,
                      subscribers: [...oldSubscribers, ...subscribers],
                  }
                : connection;
        }),
    );
    return subscribers;
};

/**
 * 获取自定义Repository的实例
 * @param dataSource 数据连接池
 * @param Repo repository类
 */
export const getCustomRepository = <T extends Repository<E>, E extends ObjectLiteral>(
    dataSource: DataSource,
    Repo: ClassType<T>,
): T => {
    if (isNil(Repo)) return null;
    const entity = Reflect.getMetadata(CUSTOM_REPOSITORY_METADATA, Repo);
    if (!entity) return null;
    const base = dataSource.getRepository<ObjectType<any>>(entity);
    return new Repo(base.target, base.manager, base.queryRunner) as T;
};
