// src/modules/database/commands/typeorm-migration.revert.ts

import { DataSource } from 'typeorm';

import { MigrationRevertOptions } from '../types';

type HandlerOptions = MigrationRevertOptions & { dataSource: DataSource };
export class TypeormMigrationRevert {
    async handler({ transaction, fake, dataSource }: HandlerOptions) {
        const options = {
            transaction:
                dataSource.options.migrationsTransactionMode ?? ('all' as 'all' | 'none' | 'each'),
            fake,
        };
        switch (transaction) {
            case 'all':
                options.transaction = 'all';
                break;
            case 'none':
            case 'false':
                options.transaction = 'none';
                break;
            case 'each':
                options.transaction = 'each';
                break;
            default:
            // noop
        }
        // 恢复上次执行的迁移。
        // 只能在与数据库建立连接后使用。
        await dataSource.undoLastMigration(options);
    }
}
