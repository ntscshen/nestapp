import { Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';

import { DatabaseModule } from '../database/database.module';

import * as controllers from './controllers';
import * as entities from './entities';
import * as repositories from './repositories';
import * as services from './services';
import { SanitizeService } from './services/sanitize.service';
import { PostSubscriber } from './subcribers';

@Module({
    imports: [
        TypeOrmModule.forFeature(Object.values(entities)), // 注册实体
        DatabaseModule.forRepository(Object.values(repositories)), // 把自定义的 Repository 类注册为提供者
    ],
    controllers: Object.values(controllers),
    providers: [...Object.values(services), SanitizeService, PostSubscriber],
    exports: [...Object.values(services)],
})
export class ContentModule {}
