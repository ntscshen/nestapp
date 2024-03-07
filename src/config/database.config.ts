import { createDbConfig } from '@/modules/database/helpers';

// export const database2 = (): TypeOrmModuleOptions => ({
//     charset: 'utf8mb4',
//     logging: ['error'],
//     type: 'mysql',
//     host: 'localhost',
//     port: 3306,
//     username: 'root',
//     password: '123456',
//     database: '3r2',
//     // 在生产环境中不应该使用 synchronize: true，否则可能会丢失生产数据。
//     synchronize: true,
//     autoLoadEntities: true,
// });

export const database = createDbConfig((configure) => ({
    common: {
        synchronize: true,
    },
    connections: [
        {
            type: 'mysql',
            host: '127.0.0.1',
            port: 3306,
            // port: 12000,
            username: 'root',
            password: '123456',
            database: '3r2',
            // database: 'nestjs-backend-3R',
            charset: 'utf8mb4',
            logging: ['error'],
        },
    ],
}));
