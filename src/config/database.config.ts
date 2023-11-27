import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const database = (): TypeOrmModuleOptions => ({
    charset: 'utf8mb4',
    logging: ['error'],
    type: 'mysql',
    // host: '127.0.0.1',
    host: 'localhost',
    port: 3306,
    username: 'root',
    password: '123456',
    database: '3r',
    // 因为我们目前没有涉及到数据迁移的命令编写，
    // 所以必须在启动数据库时自动根据加载的模型(Entity)来同步数据表到数据库
    synchronize: true,
    // 这样我们就不需要把每个模块的 Entity 逐个手动的添加到配置的 entities 数组中
    // 因为每个模块中使用 TypeOrmModule.forFeature 来动态的加入 Entity
    autoLoadEntities: true,
});
