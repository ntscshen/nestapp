// src/modules/database/commands/tyeporm-migration-run.ts

import { DataSource } from 'typeorm';

import { MigrationRunOptions } from '../types';

type HandlerOptions = MigrationRunOptions & { dataSource: DataSource };
/**
 * fake 用于指示迁移是否应该标记为执行，而不实际执行SQL语句
 * */
export class TypeormMigrationRun {
    async handler({ transaction, fake, dataSource }: HandlerOptions) {
        const options = {
            transaction:
                dataSource.options.migrationsTransactionMode ?? ('all' as 'all' | 'none' | 'each'),
            fake,
        };
        switch (transaction) {
            // 所有迁移在同一个事务中执行
            case 'all':
                options.transaction = 'all';
                break;
            // 迁移不适用事务
            case 'none':
            case 'false':
                options.transaction = 'none';
                break;
            // 每个迁移使用独立的事务
            case 'each':
                options.transaction = 'each';
                break;
            default:
            // noop
        }
        await dataSource.runMigrations(options);
    }
}
