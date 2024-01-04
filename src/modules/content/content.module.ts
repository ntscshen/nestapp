import { Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';

import { DatabaseModule } from '../database/database.module';

import { CategoryController } from './controllers/category.controller';
import { CommentController } from './controllers/comment.controller';
import { PostController } from './controllers/post.controller';
import { CategoryEntity, CommentEntity, PostEntity, TagEntity } from './entities';
import { CommentRepository, PostRepository } from './entities/repositories';
import { CategoryRepository } from './entities/repositories/category.repository';
import { SanitizeService } from './services';
import { CategoryService } from './services/category.service';
import { CommentService } from './services/comment.service';
import { PostService } from './services/post.service';
import { PostSubscriber } from './subscribers';

@Module({
    imports: [
        TypeOrmModule.forFeature([PostEntity, CategoryEntity, CommentEntity, TagEntity]), // 注入对应的Entity
        // 将每一个自定义的Repository继承Repository，然后注入到provider中
        DatabaseModule.forRepository([PostRepository, CategoryRepository, CommentRepository]),
    ],
    controllers: [PostController, CategoryController, CommentController],
    providers: [PostService, CategoryService, CommentService, PostSubscriber, SanitizeService],
})
export class ContentModule {}
