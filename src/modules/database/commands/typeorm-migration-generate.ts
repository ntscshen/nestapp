// src/modules/database/commands/typeorm-migration-generate.ts

import path from 'path';

import { format } from '@sqltools/formatter/lib/sqlFormatter';
import chalk from 'chalk';
import { upperFirst } from 'lodash';
import { DataSource } from 'typeorm';

import { MigrationGenerateOptions } from '../types';

// TypeORM 提供的工具函数。
const { CommandUtils } = require('typeorm/commands/CommandUtils');
const { PlatformTools } = require('typeorm/platform/PlatformTools');

// 将字符串转换为驼峰式大小写的函数。
const { camelCase } = require('typeorm/util/StringUtils');

type HandlerOptions = MigrationGenerateOptions & {
    dataSource: DataSource;
} & { dir: string };
/**
 * 根据实体和数据库当前状态的差异生成TypeORM迁移文件
 * 1. 检测数据库模式变更
 * 2. 生成相应的SQL语句
 * 3. 将这些语句嵌入到一个迁移文件模板中
 * 还支持美化SQL
 * */
export class TypeormMigrationGenerate {
    // 自动生成TypeORM迁移文件
    async handler(args: HandlerOptions) {
        const timestamp = new Date().getTime();
        const extension = '.ts';
        // const extension = args.outputJs ? '.js' : '.ts';
        const directory = args.dir.startsWith('/')
            ? args.dir
            : path.resolve(process.cwd(), args.dir);
        const filename = `${timestamp}-${args.name}`;
        const fullPath = `${directory}/${filename}${extension}`;
        const { dataSource } = args;
        try {
            // 主要目的：生成迁移的过程中暂时修改数据源的行为。以确保生成迁移的过程中不会对现有数据造成任何实际上的改变
            // 在生成迁移文件时创建了一个“安全模式”，其中 TypeORM 的自动行为（如同步数据库模式、运行迁移、删除模式和日志记录）都被禁用。
            // 这样做的目的是为了保护现有的数据库状态，防止在生成迁移文件的过程中发生任何可能影响数据库的操作，
            // 同时保持输出的清晰。这是生成迁移脚本时的一种最佳实践，旨在确保过程的准确性和安全性。
            dataSource.setOptions({
                synchronize: false, // 确保TypeORM不会尝试自动同步实体和数据库，从而避免对数据库进行任何未经计划的修改
                migrationsRun: false, // 不自动运行迁移，不会自动运行任何已存在的迁移脚本，保持数据库模式的当前状态不变。
                dropSchema: false, // 不删除模式，是否在连接到数据库时自动删除整个数据库模式（即删除所有表），这确保了在生成迁移的过程中，不会丢失数据库中的任何数据或结构。
                logging: false, // 不进行日志记录，不会在控制台输出任何 SQL 日志或其他日志信息，使得生成过程更为清洁，只关注必要的输出信息。
            });
            await dataSource.initialize();
            const upSqls: string[] = [];
            const downSqls: string[] = [];

            // 生成当前实体与数据库之间的差异的SQL语句
            try {
                // 生成当前实体与数据库之间的差异的SQL语句
                // createSchemaBuilder 目的是为了执行数据库模式变更的操作，如创建或修改表结构等
                // log: 是执行数据库模式的分析，并生成相应的 SQL 日志。这些日志包含了根据当前实体模型与数据库现有模式之间的差异，所需执行的 SQL 语句。
                const sqlInMemory = await dataSource.driver.createSchemaBuilder().log();

                // 格式化SQL语句
                if (args.pretty) {
                    sqlInMemory.upQueries.forEach((upQuery) => {
                        upQuery.query = TypeormMigrationGenerate.prettifyQuery(upQuery.query);
                    });
                    sqlInMemory.downQueries.forEach((downQuery) => {
                        downQuery.query = TypeormMigrationGenerate.prettifyQuery(downQuery.query);
                    });
                }

                // 处理SQL语句，遍历生成的SQL语句，转化为字符串形式，并处理可能存在的特殊字符
                sqlInMemory.upQueries.forEach((upQuery) => {
                    upSqls.push(
                        `        await queryRunner.query(\`${upQuery.query.replace(
                            /`/g,
                            '\\`',
                        )}\`${TypeormMigrationGenerate.queryParams(upQuery.parameters)});`,
                    );
                });
                sqlInMemory.downQueries.forEach((downQuery) => {
                    downSqls.push(
                        `        await queryRunner.query(\`${downQuery.query.replace(
                            /`/g,
                            '\\`',
                        )}\`${TypeormMigrationGenerate.queryParams(downQuery.parameters)});`,
                    );
                });
            } finally {
                await dataSource.destroy();
            }

            // 没有检测到任何变更，即没有up SQL语句，则打印消息并正常退出
            if (!upSqls.length) {
                // 未发现数据库模式有任何更改
                console.log(chalk.green(`No changes in database schema were found`));
                process.exit(0);
            }

            // 生成迁移内容
            const fileContent = TypeormMigrationGenerate.getTemplate(
                args.name,
                timestamp,
                upSqls,
                downSqls.reverse(),
            );
            // 如果在模式下运行，用于检测当前数据库模式和实体定义之间的差异
            // 在当前模式下，handler方法会生成迁移内容但不会实际场景文件。
            // 如果发现了与当前模式不匹配的变更，会打印这些变更并以非零状态退出，只是检查失败
            // 场景：自动化流程中验证是否有未预期的数据库模式变更
            if (args.check) {
                console.log(
                    // 在检查模式下发现数据库模式有意外更改
                    chalk.yellow(
                        `Unexpected changes in database schema were found in check mode:\n\n${chalk.white(
                            fileContent,
                        )}`,
                    ),
                );
                process.exit(1);
            }

            // 干运行模式下，允许开发者预览将要执行的迁移操作，而不实际在数据库上应用这些变更
            if (args.dryrun) {
                console.log(
                    chalk.green(
                        `Migration ${chalk.blue(
                            fullPath + extension,
                        )} has content:\n\n${chalk.white(fileContent)}`,
                    ),
                );
            } else {
                await CommandUtils.createFile(fullPath, fileContent);

                console.log(
                    chalk.green(
                        `Migration ${chalk.blue(fullPath)} has been generated successfully.`,
                    ),
                );
            }
        } catch (err) {
            PlatformTools.logCmdErr('Error during migration generation:', err);
            process.exit(1);
        }
    }

    /**
     * 格式化SQL查询参数
     * @param parameters 参数 一个可选的数组，包含SQL语句的参数
     *        如果有参数，函数返回一个字符串，其中包含这些参数的JSON字符串表示
     *        如果没有，则返回一个空字符串
     * 确保SQL语句的参数在迁移文件中被正确地处理和表示
     * */
    protected static queryParams(parameters: any[] | undefined): string {
        if (!parameters || !parameters.length) {
            return '';
        }

        return `, ${JSON.stringify(parameters)}`;
    }

    protected static getTemplate(
        name: string,
        timestamp: number,
        upSqls: string[],
        downSqls: string[],
    ): string {
        // camelCase 参数转换成驼峰命名
        // upperFirst 如果字符串的第一个字符是字母，则将其转换为大写，否则返回原始字符串。
        const migrationName = `${camelCase(upperFirst(name), true)}${timestamp}`;

        return `/* eslint-disable import/no-import-module-exports */
        import { MigrationInterface, QueryRunner } from "typeorm";

class ${migrationName} implements MigrationInterface {
    name = '${migrationName}'

    public async up(queryRunner: QueryRunner): Promise<void> {
${upSqls.join(`
`)}
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
${downSqls.join(`
`)}
    }

}

module.exports = ${migrationName}
`;
    }

    /**
     * 格式化SQL查询
     * @param query 一个字符串，表示要格式化的 SQL 语句。
     * @return 返回一个格式化后的 SQL 语句字符串。
     *         它使用了 format 函数（sql-formatter）来美化 SQL 代码，然后调整缩进，
     *         使得格式化后的 SQL 语句在迁移文件中的显示更加整洁。
     * */
    protected static prettifyQuery(query: string) {
        const formattedQuery = format(query, { indent: '    ' });
        return `\n${formattedQuery.replace(/^/gm, '            ')}\n        `;
    }
}
