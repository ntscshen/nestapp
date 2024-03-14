import chalk from 'chalk';
import { isNil, pick } from 'lodash';
import ora from 'ora';
import { DataSource, DataSourceOptions } from 'typeorm';
import { Arguments } from 'yargs';

import { Configure } from '@/modules/config/configure';

import { getRandomCharString, panic } from '@/modules/core/utils';

import { DbConfig, MigrationGenerateArguments } from '../types';

import { TypeormMigrationGenerate } from './typeorm-migration-generate';

/**
 * 生成迁移处理器
 * @param configure
 * @param args
 */
export const MigrationGenerateHandler = async (
    configure: Configure,
    args: Arguments<MigrationGenerateArguments>,
) => {
    // await MigrationRunHandler(configure, { connection: args.connection } as any);
    console.log();
    const spinner = ora('Start to generate migration');
    const cname = args.connection ?? 'default';
    try {
        spinner.start();
        console.log();
        const { connections = [] }: DbConfig = await configure.get<DbConfig>('database');
        const dbConfig = connections.find(({ name }) => name === cname);
        if (isNil(dbConfig)) panic(`Database connection named ${cname} not exists!`);
        console.log();
        const runner = new TypeormMigrationGenerate();
        const dataSource = new DataSource({ ...dbConfig } as DataSourceOptions);
        console.log();
        await runner.handler({
            name: args.name ?? getRandomCharString(6),
            dir: dbConfig.paths.migration,
            dataSource,
            ...pick(args, ['pretty', 'outputJs', 'dryrun', 'check']),
        });
        // 迁移过程中使用的数据库连接在完成后应该关闭，以释放资源并维护系统的稳定性
        if (dataSource.isInitialized) await dataSource.destroy();
        spinner.succeed(chalk.greenBright.underline('\n 👍 Finished generate migration'));
        if (args.run) {
            console.log();
        }
    } catch (error) {
        panic({ spinner, message: 'Generate migration failed!', error });
    }
};
