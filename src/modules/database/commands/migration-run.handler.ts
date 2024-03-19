import { join } from 'path';

import chalk from 'chalk';
import { isNil } from 'lodash';
import ora from 'ora';
import { DataSource, DataSourceOptions } from 'typeorm';
import { Arguments } from 'yargs';

import { Configure } from '@/modules/config/configure';

import { panic } from '@/modules/core/utils';

import { DbConfig, MigrationRunArguments } from '../types';

import { TypeormMigrationRun } from './typeorm-migration-run';

/**
 * 运行迁移处理器
 * @param configure
 * @param args
 */
export const MigrationRunHandler = async (
    configure: Configure,
    args: Arguments<MigrationRunArguments>,
) => {
    const spinner = ora('Start to run migrations');
    const cname = args.connection ?? 'default';
    let dataSource: DataSource | undefined;
    try {
        spinner.start();
        const { connections = [] }: DbConfig = await configure.get<DbConfig>('database');
        const dbConfig = connections.find(({ name }) => name === cname);
        if (isNil(dbConfig)) panic(`Database connection named ${cname} not exists!`);
        let dropSchema = false; // 用于后续决定是否需要删除（刷新）数据库模式
        dropSchema = args.refresh || args.onlydrop;
        console.log(); // 用于美观
        const runner = new TypeormMigrationRun(); // 创建一个 TypeormMigrationRun 类的实例，该实例将用于执行迁移相关的操作。
        dataSource = new DataSource({ ...dbConfig } as DataSourceOptions);
        if (dataSource && dataSource.isInitialized) await dataSource.destroy();

        const options = {
            subscribers: [],
            synchronize: false, // 禁用自动同步
            migrationsRun: false, // 禁用自动迁移
            // 意味着移除数据库中所有的表、视图、索引、约束等对象，
            // 实际上是清空数据库，使之回到一个没有任何结构和数据的初始状态
            dropSchema, // 根据之前的设置决定是否在运行迁移之前删除(刷新)当前的数据模式
            logging: ['error'], // 配置日志记录的级别。这里设置为仅记录错误信息。
            migrations: [
                // 指定迁移文件的路径
                join(dbConfig.paths.migration, '**/*.ts'),
                join(dbConfig.paths.migration, '**/*.js'),
            ],
        } as any;
        // 如果为真，表示调用者请求删除当前数据库模式（用户希望在运行迁移之前刷新数据库模式）
        // 1. 使用这种模式时需要格外小心，因为它会导致数据库中所有现有结构和数据的丢失。
        // 2. 在生产环境中通常不推荐使用这种操作，除非你完全清楚这样做的后果。
        // 通常认为是：重置数据库状态、重置数据库状态、重置数据库状态
        if (dropSchema) {
            dataSource.setOptions(options); // 设置数据源的配置选项
            await dataSource.initialize(); // 初始化数据源，这一步实际上建立了与数据库的连接
            // 销毁数据源，这一步关闭与数据库的连接，并执行清理工作
            // 如果在初始化时数据库模式已经被删除，这时数据库应该已经是空的了
            await dataSource.destroy();
            spinner.succeed(chalk.greenBright.underline('\n 👍 Finished drop database schema'));
            // 只删除数据库模式而不执行其他操作（如果制定了仅删除模式，那么程序在此处就退出了）
            // 在成功删除数据库模式后，立即退出程序
            // 这运行在不需要执行任何迁移的情况下快速清空数据库
            if (args.onlydrop) process.exit(); // 程序立即退出，后续代码不会被执行
        }

        // 无论是否进行删除操作，以下逻辑都会被执行（除非onlydrop === true）
        // 将dropSchema: false主要为了确保不会再次触发删除操作
        dataSource.setOptions({ ...options, dropSchema: false });

        await dataSource.initialize(); // 设置了 dropSchema: true 并调用 initialize() 方法时，TypeORM 会在初始化过程中执行删除（刷新）数据库模式的操作。

        console.log();
        // 调用迁移逻辑，运行待处理的迁移
        // 数据源、事物模式选择、是否伪造模拟运行
        await runner.handler({
            dataSource,
            transaction: args.transaction,
            fake: args.fake,
        });
        spinner.succeed(chalk.greenBright.underline('\n 👍 Finished run migrations'));
    } catch (error) {
        if (dataSource && dataSource.isInitialized) await dataSource.destroy();
        panic({ spinner, message: 'Run migrations failed!', error });
    }

    if (dataSource && dataSource.isInitialized) await dataSource.destroy();
};
