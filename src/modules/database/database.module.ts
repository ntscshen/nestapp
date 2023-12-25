import { DynamicModule, Module, Provider, Type } from '@nestjs/common';
import { TypeOrmModule, TypeOrmModuleOptions, getDataSourceToken } from '@nestjs/typeorm';
import { DataSource, ObjectType } from 'typeorm';

import { PostEntity } from '../content/entities/post.entity';

import { PostSubscriber } from '../content/subscribers';

import { CUSTOM_REPOSITORY_METADATA } from './constants';

@Module({})
export class DatabaseModule {
    static forRoot(configRegister: () => TypeOrmModuleOptions): DynamicModule {
        return {
            global: true,
            module: DatabaseModule,
            imports: [
                TypeOrmModule.forRoot({ ...configRegister(), subscribers: [PostSubscriber] }),
            ],
        };
    }

    static forRepositorySingle<T extends Type>(PostRepository: T): DynamicModule {
        const provider = {
            inject: [DataSource],
            provide: PostRepository,
            useFactory: (dataSource: DataSource) => {
                const base = dataSource.getRepository<Type<any>>(PostEntity);
                return new PostRepository(base.target, base.manager, base.queryRunner);
            },
        };

        return {
            module: DatabaseModule,
            providers: [provider],
            exports: [provider],
        };
    }

    // 当你需要根据不同的实体类或特定的逻辑来自定义仓库的行为时
    static forRepository<T extends Type<any>>(
        repositories: T[],
        dataSourceName?: string,
    ): DynamicModule {
        const providers: Provider[] = [];

        // repository 仓库repo Repo
        for (const Repo of repositories) {
            const entity = Reflect.getMetadata(CUSTOM_REPOSITORY_METADATA, Repo);

            if (!entity) {
                continue;
            }

            providers.push({
                // inject: [DataSource],
                inject: [getDataSourceToken(dataSourceName)],
                provide: Repo,
                useFactory: (dataSource: DataSource): InstanceType<typeof Repo> => {
                    const base = dataSource.getRepository<ObjectType<any>>(entity);
                    return new Repo(base.target, base.manager, base.queryRunner);
                    // 核心目的是创建一个新的仓库实例，一个特别定制的仓库实例
                },
            });
        }
        return {
            module: DatabaseModule,
            providers,
            exports: providers,
        };
    }
}
