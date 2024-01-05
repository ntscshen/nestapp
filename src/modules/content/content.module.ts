import { Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';

import { DatabaseModule } from '../database/database.module';

import { CategoryController } from './controllers/category.controller';
import { CommentController } from './controllers/comment.controller';
import { PostController } from './controllers/post.controller';
import { TagController } from './controllers/tag.controller';
import { CategoryEntity, CommentEntity, PostEntity, TagEntity } from './entities';
import { CommentRepository, PostRepository } from './entities/repositories';
import { CategoryRepository } from './entities/repositories/category.repository';
import { TagRepository } from './entities/repositories/tag.repository';
import { SanitizeService, TagService } from './services';
import { CategoryService } from './services/category.service';
import { CommentService } from './services/comment.service';
import { PostService } from './services/post.service';
import { PostSubscriber } from './subscribers';

@Module({
    imports: [
        TypeOrmModule.forFeature([PostEntity, CategoryEntity, CommentEntity, TagEntity]), // 注入对应的Entity
        DatabaseModule.forRepository([
            PostRepository,
            CategoryRepository,
            TagRepository,
            CommentRepository,
        ]), // 将每一个自定义的Repository继承Repository，然后注入到provider中
    ],
    controllers: [PostController, CategoryController, CommentController, TagController],
    providers: [
        PostService,
        CategoryService,
        CommentService,
        TagService,
        PostSubscriber,
        SanitizeService,
    ],
})
export class ContentModule {}
