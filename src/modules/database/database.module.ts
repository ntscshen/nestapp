import { DynamicModule, Module, Provider, Type } from '@nestjs/common';
import { TypeOrmModule, TypeOrmModuleOptions, getDataSourceToken } from '@nestjs/typeorm';
import { DataSource, ObjectType } from 'typeorm';

import { CUSTOM_REPOSITORY_METADATA } from './constants';

@Module({})
export class DatabaseModule {
    static forRoot(configRegister: () => TypeOrmModuleOptions): DynamicModule {
        return {
            global: true,
            module: DatabaseModule,
            imports: [TypeOrmModule.forRoot(configRegister())],
        };
    }

    // 当你需要根据不同的实体类或特定的逻辑来自定义仓库的行为时
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
            module: DatabaseModule,
            providers,
            exports: providers,
        };
    }
}
