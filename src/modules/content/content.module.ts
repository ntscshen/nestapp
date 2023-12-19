import { Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';

import { DatabaseModule } from '../database/database.module';

import { PostController } from './controllers/post.controller';
import { PostEntity } from './entities/post.entity';
import { PostRepository } from './entities/repositories';
import { PostService } from './services/post.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([PostEntity]),
        DatabaseModule.forRepository([PostRepository]),
    ],
    controllers: [PostController],
    providers: [PostService],
    // exports: [PostService, DatabaseModule.forRepository([PostRepository])],
})
export class ContentModule {}
