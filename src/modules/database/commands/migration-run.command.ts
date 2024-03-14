// src/modules/database/commands/migration-run.command.ts

import { Arguments } from 'yargs';

import { CommandItem } from '@/modules/core/types';

import { MigrationRunArguments } from '../types';

import { MigrationRunHandler } from './migration-run.handler';

/**
 * 运行迁移
 * @param param0
 */
export const RunMigrationCommand: CommandItem<any, MigrationRunArguments> = async ({
    configure,
}) => ({
    source: true,
    command: ['db:migration:run', 'dbmr'],
    describe: 'Runs all pending migrations.',
    // 运行所有待处理的迁移
    builder: {
        // 指定要使用的数据库连接名称，帮助在有多个数据库连接时指明应当使用哪一个。
        connection: {
            type: 'string',
            alias: 'c',
            describe: 'Connection name of typeorm to connect database.',
            // 用于连接数据库的 typeorm 连接名称。
        },
        // 指示是否应该在迁移运行时使用事务。它可以被设置为 'all', 'none', 或 'each'，
        // 默认值是 'default'，代表根据具体的驱动或数据源的默认行为决定。
        transaction: {
            type: 'string',
            alias: 't',
            describe:
                'Indicates if transaction should be used or not for migration run/revert/reflash. Enabled by default.',
            // 表示迁移运行/重置/重刷新时是否使用事务。默认已启用。
            default: 'default',
        },
        // 指示是否应该“伪造”迁移运行。这在数据库表结构已经通过其他方式被更改时有用，允许迁移记录被更新而不实际执行 SQL 语句。
        fake: {
            type: 'boolean',
            alias: 'f',
            describe:
                'Fakes running the migrations if table schema has already been changed manually or externally ' +
                '(e.g. through another project)',
            // 如果表模式已被手动或外部更改，则假冒运行迁移'+ '（例如通过其他项目）'
        },
        // 指示是否在运行迁移前刷新（即删除并重新创建）数据库模式。这是一个危险的操作，通常不建议在生产环境中使用。
        refresh: {
            type: 'boolean',
            alias: 'r',
            describe: 'drop database schema and run migration',
            // 删除数据库模式并运行迁移
            default: false,
        },
        // 指示是否仅删除数据库模式而不运行任何迁移。这同样是一个危险的操作，通常不建议在生产环境中使用。
        onlydrop: {
            type: 'boolean',
            alias: 'o',
            describe: 'only drop database schema',
            // 只删除数据库模式
            default: false,
        },
    } as const,

    handler: async (args: Arguments<MigrationRunArguments>) => MigrationRunHandler(configure, args),
});
