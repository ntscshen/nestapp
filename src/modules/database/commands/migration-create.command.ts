import { Arguments } from 'yargs';

import { CommandItem } from '@/modules/core/types';

import { MigrationCreateArguments } from '../types';

import { MigrationCreateHandler } from './migration-create.handler';

/**
 * 创建迁移
 * @param param0
 * 为了在命令行界面(CLI)中提供一个具体的操作，让开发者可以通过简单的命令创建新的迁移文件
 */
export const CreateMigrationCommand: CommandItem<any, MigrationCreateArguments> = async ({
    configure,
}) => ({
    source: true,
    command: ['db:migration:create', 'dbmc'], // 定义了触发这个操作的命令行指令，这里提供了两个选项 —— db:migration:create 和简写形式 dbmc。
    describe: 'Creates a new migration file', // 创建新的迁移文件
    // 定义了当前命令需要接受的参数
    builder: {
        // 如果没有指定，通常会标记为default进行连接，意味着如果应用只涉及到一个数据库，或者只针对默认数据库生成迁移
        // 那么就不需要显示指定connection参数。
        // connection 参数的设计，反映了在大多数单数据库应用场景下提供简化操作的意图，同时保留了对多数据库环境的支持
        connection: {
            type: 'string',
            alias: 'c',
            describe: 'Connection name of typeorm to connect database.', // 用于连接数据库的 typeorm 连接名称。
        },
        name: {
            type: 'string',
            alias: 'n',
            describe: 'Name of the migration class.',
            demandOption: true, // 这是一个必需参数
        },
    } as const,

    handler: async (args: Arguments<MigrationCreateArguments>) =>
        MigrationCreateHandler(configure, args),
});
