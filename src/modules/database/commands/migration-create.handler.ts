import chalk from 'chalk';
import { isNil } from 'lodash';
import ora from 'ora';
import { Arguments } from 'yargs';

import { Configure } from '@/modules/config/configure';

import { panic } from '@/modules/core/utils';

import { DbOptions, MigrationCreateArguments, TypeormOption } from '../types';

import { TypeormMigrationCreate } from './typeorm-migration-create';

/**
 * 创建迁移处理器
 * @param configure
 * @param args
 * 封装了迁移文件创建的全部逻辑
 * 1. 读取配置
 * 2. 检查数据库连接配置
 * 3. 实际触发迁移文件的创建
 */
export const MigrationCreateHandler = async (
    configure: Configure,
    args: Arguments<MigrationCreateArguments>,
) => {
    // 1. 初始化加载动画：使用 ora 库初始化一个加载动画（spinner），提示开始创建迁移。
    const spinner = ora('Start to create migration').start();
    // 2. 获取数据库连接名称：从 args 中读取数据库连接名称（cname），如果没有提供，则默认使用 'default'。
    const cname = args.connection ?? 'default';
    try {
        // 3. 加载数据库配置：从配置中获取所有数据库连接的配置（connections），并找到名称与 cname 匹配的数据库配置（dbConfig）。
        const { connections = [] } = await configure.get<DbOptions>('database');
        const dbConfig: TypeormOption = connections.find(({ name }) => name === cname);
        // 4. 检查数据库连接配置：如果没有找到指定名称的数据库连接配置，使用 panic 函数抛出错误并终止操作。
        if (isNil(dbConfig)) panic(`Database connection named ${cname} not exists!`);
        // 5.1 创建一个 TypeormMigrationCreate 实例（runner），它封装了迁移创建的逻辑。
        const runner = new TypeormMigrationCreate();
        console.log();
        // 5.2 调用 runner.handler 方法，传递迁移名称和迁移文件应该存放的目录路径（从 dbConfig.paths.migration 获取）。
        runner.handler({
            name: cname,
            dir: dbConfig.paths.migration,
        });
        // 6. 操作成功反馈：如果迁移文件成功创建，停止加载动画并显示成功消息。消息使用 chalk 库进行样式处理，增加可读性。
        spinner.succeed(chalk.greenBright.underline('\n 👍 Finished create migration'));
    } catch (error) {
        panic({ spinner, message: 'Create migration failed!', error });
    }
};
