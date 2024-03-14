// src/modules/database/commands/typeorm-migration-create.ts

import path from 'path';

import chalk from 'chalk';

import { MigrationCreateOptions } from '../types';

// TypeORM 提供的工具函数。
const { CommandUtils } = require('typeorm/commands/CommandUtils');
const { PlatformTools } = require('typeorm/platform/PlatformTools');
// 将字符串转换为驼峰式大小写的函数。
const { camelCase } = require('typeorm/util/StringUtils');

type HandlerOptions = MigrationCreateOptions & { dir: string };

export class TypeormMigrationCreate {
    /**
     * 创建迁移文件（函数封装了迁移文件创建的整个流程，从生成文件名到计算文件路径，再到实际创建文件和输出成功消息。）
     * @param args 包含迁移文件的名称name和目标目录dir
     * 1. timestamp(生成时间戳): 使用 new Date().getTime() 生成一个时间戳，这个时间戳用于确保迁移文件名的唯一性并按创建顺序排序。
     * 2. directory(确定目标路径): 判断 args.dir 是否是绝对路径(以 / 开头)。
     *      如果是，直接使用该路径，
     *      如果不是，使用path.resolve将其解析为相对于当前目录的绝对路径
     * */
    async handler(args: HandlerOptions) {
        try {
            const timestamp = new Date().getTime();
            const directory = args.dir.startsWith('/')
                ? args.dir
                : path.resolve(process.cwd(), args.dir);

            const fileContent = TypeormMigrationCreate.getTemplate(args.name as any, timestamp);
            const filename = `${timestamp}-${args.name}`;
            const fullPath = `${directory}/${filename}`;
            // 创建一个新的TS迁移文件，并将生成的模板内容写入该文件
            await CommandUtils.createFile(`${fullPath}.ts`, fileContent);
            // 在成功创建迁移文件后，使用 console.log 输出一条成功消息，包含新创建的迁移文件的路径。
            // 这里使用了 chalk.blue 为文件路径添加蓝色高亮，以提高可读性。
            console.log(
                `Migration ${chalk.blue(`${fullPath}.ts`)} has been generated successfully.`,
            );
        } catch (err) {
            PlatformTools.logCmdErr('Error during migration creation:', err);
            process.exit(1);
        }
    }

    /**
     * 获取迁移文件的内容
     * @param name 迁移的名称（ 通常是描述迁移目的的字符串，例如CreateUserTable ）
     * @param timestamp 时间戳（用于生产迁移文件名的一部分，如 1637175118-CreateUserTable，确保迁移的文件名的唯一）
     * */
    protected static getTemplate(name: string, timestamp: number): string {
        return `/* eslint-disable import/no-import-module-exports */
        import { MigrationInterface, QueryRunner } from "typeorm";

class ${camelCase(name, true)}${timestamp} implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
    }

}
`;
    }
    /**
        MigrationInterface 是所有迁移类所需要实现的接口
        QueryRunner 用于在迁移方法中执行数据库操作
        up: 定义如何应用迁移的地方，up 方法接受一个 QueryRunner 实例作为参数，你可以使用它来执行数据库操作，比如创建或修改表结构。
            这个方法是异步的（async），因为数据库操作通常是异步执行的。
        down: 定义如何回滚迁移的地方，和 up 方法一样，它也接受一个 QueryRunner 实例，并且是异步的。
            在这个方法中，你应该撤销 up 方法中所做的所有数据库变更，以便可以安全地回滚迁移。
        getTemplate 方法为新迁移提供了一个基本的模板，其中包含了迁移类的骨架和必要的导入。
            开发者需要再up和down方法中填充具体的数据库操作逻辑，以实现迁移的目的和回滚策略。
            这种模板化的方法简化了迁移文件的创建过程，使开发者可以专注于定义具体的迁移逻辑
     * */
}
