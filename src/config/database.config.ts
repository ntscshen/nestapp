import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const database = (): TypeOrmModuleOptions => ({
    charset: 'utf8mb4',
    logging: ['error'],
    type: 'mysql',
    host: 'localhost',
    port: 3306,
    username: 'root',
    password: '123456',
    database: '3r2',
    // 在生产环境中不应该使用 synchronize: true，否则可能会丢失生产数据。
    synchronize: true,
    autoLoadEntities: true,
});
