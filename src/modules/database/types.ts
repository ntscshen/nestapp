// src/modules/database/types.ts
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import {
    FindTreeOptions,
    ObjectLiteral,
    Repository,
    SelectQueryBuilder,
    TreeRepository,
} from 'typeorm';

import { Arguments } from 'yargs';

import { SelectTrashMode } from '../content/constants';

import { BaseRepository } from './base/repository';
import { BaseTreeRepository } from './base/tree.repository';
import { OrderType } from './constants';

export type QueryHook<Entity> = (
    qb: SelectQueryBuilder<Entity>,
) => Promise<SelectQueryBuilder<Entity>>;

/**
 * 分页原数据
 */
export interface PaginateMeta {
    /**
     * 当前页项目数量
     */
    itemCount: number;
    /**
     * 项目总数量
     */
    totalItems?: number;
    /**
     * 每页显示数量
     */
    perPage: number;
    /**
     * 总页数
     */
    totalPages?: number;
    /**
     * 当前页数
     */
    currentPage: number;
}
/**
 * 分页选项
 */
export interface PaginateOptions {
    /**
     * 当前页数
     */
    page?: number;
    /**
     * 每页显示数量
     */
    limit?: number;
}

/**
 * 分页返回数据
 */
export interface PaginateReturn<E extends ObjectLiteral> {
    meta: PaginateMeta;
    items: E[];
}
/**
 * 排序类型,{字段名称: 排序方法}
 * 如果多个值则传入数组即可
 * 排序方法不设置,默认DESC
 */
export type OrderRule = {
    name: string;
    order: OrderType;
};

export type OrderQueryType = string | OrderRule | OrderRule[];

export interface QueryParams<E extends ObjectLiteral> {
    addQuery?: QueryHook<E>; // 添加额外的回调查询
    orderBy?: OrderQueryType; // 排序
    withTrashed?: boolean; // 是否包含软删除
    onlyTrashed?: boolean; // 是否只包含软删除(withTrashed为true时有效)
}

// 带软删除的服务类数据列表查询类型
export type ServiceListQueryOptionWithTrashed<E extends ObjectLiteral> = Omit<
    FindTreeOptions & QueryParams<E>,
    'withTrashed'
> & {
    trashed?: `${SelectTrashMode}`;
} & Record<string, any>;

// 不带软删除的服务类数据列表查询类型
export type ServiceListQueryOptionNotWithTrashed<E extends ObjectLiteral> = Omit<
    ServiceListQueryOptionWithTrashed<E>,
    'trashed'
>;
// 服务类数据列表查询类型
export type ServiceListQueryOption<E extends ObjectLiteral> =
    | ServiceListQueryOptionWithTrashed<E>
    | ServiceListQueryOptionNotWithTrashed<E>;

/**
 * 自定义数据库配置
 * */
export type DbConfig = {
    common: Record<string, any> & DbAdditionalOption;
    connections: Array<TypeOrmModuleOptions & { name?: string } & DbAdditionalOption>;
};
/**
 * Typeorm连接配置
 * */
export type TypeormOption = Omit<TypeOrmModuleOptions, 'name' | 'migrations'> & {
    name: string;
} & DbAdditionalOption;

/**
 * 最终数据库配置
 */
export type DbOptions = Record<string, any> & {
    common: Record<string, any>;
    connections: TypeormOption[];
};

/**
 * Repository类型
 */
export type RepositoryType<E extends ObjectLiteral> =
    | Repository<E>
    | TreeRepository<E>
    | BaseRepository<E>
    | BaseTreeRepository<E>;

/**
 * 额外数据库选项，用于CLI工具
 * */
type DbAdditionalOption = {
    paths?: {
        // 迁移文件路径
        migration?: string;
    };
};

export type TypeOrmArguments = Arguments<{
    connection?: string;
}>;

export interface MigrationCreateOptions {
    name: string;
}

/**
 * 创建迁移命令参数
 */
export type MigrationCreateArguments = TypeOrmArguments & MigrationCreateOptions;

/**
 * 生成迁移处理器选项
 * Dry Run 干运行，这是一种测试模式，其中迁移生成的命令会执行所有正常操作，但不会实际在数据库上应用变更。
 *         它允许开发者预览将要执行的 SQL 语句，而不产生实际影响。这对于验证迁移逻辑是否按预期工作非常有用。
 * */
export interface MigrationGenerateOptions {
    name?: string;
    run?: boolean;
    // pretty 打印 sql（ 是否打印生成的迁移文件所要执行的SQL，默认：false ）
    pretty?: boolean;
    // 是否只打印生成的迁移文件的内容，而不是直接生成迁移文件，默认: false
    dryrun?: boolean;
    // 是否只验证数据库是最新的而不是直接生成迁移，默认: false
    check?: boolean;
}

export type MigrationGenerateArguments = TypeOrmArguments & MigrationGenerateOptions;

/**
 * 恢复迁移处理器选项
 * 定义了回滚迁移命令的参数
 */
export interface MigrationRevertOptions {
    transaction?: string;
    fake?: boolean;
}

// 运行迁移处理器选项
export interface MigrationRunOptions extends MigrationRevertOptions {
    // 指示是否刷新数据库。设置为 true 时，操作将删除所有表结构并重新运行迁移来重建数据库模式。
    // 这在开发或测试环境中重置数据库到初始状态非常有用，但显然在生产环境下是危险且不应使用的。
    refresh?: boolean;
    // 是否仅删除数据库表结构而不重新运行迁移。
    // 这可以用来清理数据库，为重新构建表结构做准备，同样在生成环境下不应该使用
    onlydrop?: boolean;
}

/**
 * 运行迁移的命令参数
 */
export type MigrationRunArguments = TypeOrmArguments & MigrationRunOptions;

/**
 * 恢复迁移的命令参数
 */
export type MigrationRevertArguments = TypeOrmArguments & MigrationRevertOptions;
