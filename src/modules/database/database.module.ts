import { DynamicModule, Module, Provider, Type } from '@nestjs/common';

import { TypeOrmModule, TypeOrmModuleOptions, getDataSourceToken } from '@nestjs/typeorm';

import { DataSource, ObjectType } from 'typeorm';

import { CUSTOM_REPOSITORY_METADATA } from './constants';

@Module({})
export class DatabaseModule {
    static forRoot(configRegister: () => TypeOrmModuleOptions): DynamicModule {
        // 这个返回值除了"module", 其他的值和静态模块参数一模一样
        return {
            global: true,
            module: DatabaseModule,
            // 连接数据库
            imports: [TypeOrmModule.forRoot(configRegister())],
        };
    }

    // 1. 注册为一个静态方法， 用于把自定义的 Repository 类注册为提供者
    static forRepository<T extends Type<any>>(
        repositories: T[],
        dataSourceName?: string,
    ): DynamicModule {
        const providers: Provider[] = [];
        for (const Repo of repositories) {
            const entity = Reflect.getMetadata(CUSTOM_REPOSITORY_METADATA, Repo);
            if (!entity) {
                continue;
            }
            providers.push({
                inject: [getDataSourceToken(dataSourceName)],
                provide: Repo,
                useFactory: (dataSource: DataSource): InstanceType<typeof Repo> => {
                    const base = dataSource.getRepository<ObjectType<any>>(entity);
                    return new Repo(base.target, base.manager, base.queryRunner);
                },
            });
        }

        return {
            exports: providers,
            module: DatabaseModule,
            providers,
        };
    }
}

// Register 注册
// Repo 回购

// new Repo(base.target, base.manager, base.queryRunner);
// 这段代码是在创建一个新的 Repo 类的实例。在这个实例化的过程中，它接收了三个参数：base.target、base.manager 和 base.queryRunner。

// 这三个参数通常来自于 TypeORM 中的 Repository 类，它们分别代表：

// base.target: 通常是实体类（Entity）的构造函数，它表示这个仓库（Repository）是操作哪个实体类的。
// base.manager: 是 EntityManager 的实例，它提供了许多数据库操作的方法，例如查询、插入、更新、删除等。
// base.queryRunner: 是 QueryRunner 的实例，它用于执行原始 SQL 查询和事务操作。

// 通过这段代码，你实际上是在创建一个自定义的 Repository，这个 Repository 不仅拥有 TypeORM 原生的 Repository 功能（通过 base 提供），
// 还能添加自定义的方法。这种方式常用于在 TypeORM 的基础上添加额外的业务逻辑。

// 总结一下，这段代码创建了一个新的自定义 Repository 实例，
// 这个实例结合了原生 Repository 的功能（通过base.target, base.manager, base.queryRunner实现）和
// 自定义的 Repository 方法（在 Repo 类中定义）。这样做的好处是能够把通用的数据库操作逻辑封装在 Repository 中，提高代码的可重用性和可维护性。
