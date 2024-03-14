// src/modules/database/commands/migration-generate.command.ts

import { Arguments } from 'yargs';

import { CommandItem } from '@/modules/core/types';

import { MigrationGenerateArguments } from '../types';

import { MigrationGenerateHandler } from './migration-generate.handler';

/**
 * 生成迁移
 */
export const GenerateMigrationCommand: CommandItem<any, MigrationGenerateArguments> = async ({
    configure,
}) => ({
    instant: true,
    command: ['db:migration:generate', 'dbmg'],
    // 自动生成新的迁移文件，需要执行 sql 才能更新模式。
    describe: 'Auto generates a new migration file with sql needs to be executed to update schema.',
    builder: {
        // 指定要使用的数据库连接名称。如果有多个数据库连接，这个选项允许用户指定针对哪个连接生成迁移。
        connection: {
            type: 'string',
            alias: 'c',
            describe: 'Connection name of typeorm to connect database.',
            // 用于连接数据库的 typeorm 连接名称。
        },
        // 定义生成的迁移类的名称。
        name: {
            type: 'string',
            alias: 'n',
            describe: 'Name of the migration class.',
            // 迁移类别的名称。
        },
        // 指示是否在生成迁移文件后立即执行这个迁移。默认值为 false。
        run: {
            type: 'boolean',
            alias: 'r',
            describe: 'Run migration after generated.',
            // 生成后运行迁移。
            default: false,
        },
        // 指定生成迁移文件的目录。这允许用户自定义迁移文件存放的位置。
        dir: {
            type: 'string',
            alias: 'd',
            describe: 'Which directory where migration should be generated.',
            // 应在哪个目录下生成迁移。
        },
        // 控制是否美化（格式化）生成的 SQL 语句。默认值为 false。
        pretty: {
            type: 'boolean',
            alias: 'p',
            describe: 'Pretty-print generated SQL',
            // 漂亮打印生成的 SQL
            default: false,
        },
        // 指示是否仅打印迁移文件的内容而不实际写入文件。这对于预览迁移操作非常有用。默认值为 false。
        dryrun: {
            type: 'boolean',
            alias: 'dr',
            describe: 'Prints out the contents of the migration instead of writing it to a file',
            // 打印迁移内容，而不是将其写入文件
            default: false,
        },
        // ，用于验证当前数据库是否已经是最新的，以及是否需要执行任何迁移。如果需要迁移而数据库未更新，则退出代码为 1。默认值为 false。
        check: {
            type: 'boolean',
            alias: 'ch',
            describe:
                'Verifies that the current database is up to date and that no migrations are needed. Otherwise exits with code 1.',
            // 验证当前数据库是否是最新的，是否不需要迁移。否则以代码 1 退出。
            default: false,
        },
    } as const,

    handler: async (args: Arguments<MigrationGenerateArguments>) =>
        MigrationGenerateHandler(configure, args),
});
