import { Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';

import { DatabaseModule } from '../database/database.module';

import { PostController } from './controllers/post.controller';
import { CategoryEntity, PostEntity } from './entities';
import { PostRepository } from './entities/repositories';
import { SanitizeService } from './services';
import { PostService } from './services/post.service';
import { PostSubscriber } from './subscribers';

@Module({
    imports: [
        TypeOrmModule.forFeature([PostEntity, CategoryEntity]),
        // DatabaseModule.forRepository([PostRepository]),
        DatabaseModule.forRepositorySingle(PostRepository),
    ],
    controllers: [PostController],
    providers: [PostService, PostSubscriber, SanitizeService],
})
export class ContentModule {}
