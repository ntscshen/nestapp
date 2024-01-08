import { Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';

import { DatabaseModule } from '../database/database.module';

import * as controllers from './controllers';
import * as entities from './entities';
import * as repositories from './entities/repositories';
import * as services from './services';
import { SanitizeService } from './services/sanitize.service';
import { PostSubscriber } from './subscribers';

console.log('🚀 ~ file: content.module.ts:8 ~ controllers:', controllers);

@Module({
    imports: [
        TypeOrmModule.forFeature(Object.values(entities)), // 注入对应的Entity
        DatabaseModule.forRepository(Object.values(repositories)), // 将每一个自定义的Repository继承Repository，然后注入到provider中
    ],
    controllers: [...Object.values(controllers)],
    providers: [...Object.values(services), SanitizeService, PostSubscriber],
})
export class ContentModule {}
