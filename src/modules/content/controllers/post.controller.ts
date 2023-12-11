import {
    Body,
    Delete,
    Get,
    NotFoundException,
    Param,
    Patch,
    Post,
    Controller,
} from '@nestjs/common';

import { isNil } from 'lodash';

import { PostEntity } from '../type';

let posts: PostEntity[] = [
    { title: '第一篇文章标题', body: '第一篇文章内容' },
    { title: '第二篇文章标题', body: '第二篇文章内容' },
    { title: '第三篇文章标题', body: '第三篇文章内容' },
    { title: '第四篇文章标题', body: '第四篇文章内容' },
    { title: '第五篇文章标题', body: '第五篇文章内容' },
    { title: '第六篇文章标题', body: '第六篇文章内容' },
].map((v, id) => ({ ...v, id }));
console.log('posts :>> ', posts);
@Controller('post')
export class PostController {
    @Get()
    async getPosts(): Promise<PostEntity[]> {
        return posts;
    }

    @Get(':id')
    async getPostById(@Param('id') id: string): Promise<PostEntity> {
        const post = posts.find((item) => item.id === Number(id));
        if (isNil(post)) throw new NotFoundException(`the post with id ${id} not exits!`);
        return post;
    }

    @Post()
    async createPost(@Body() data: PostEntity): Promise<PostEntity> {
        const newPost: PostEntity = {
            id: Math.max(...posts.map(({ id }) => id + 1)),
            ...data,
        };
        posts.push(newPost);
        return newPost;
    }

    @Patch()
    async updatePost(@Body() data: Partial<PostEntity>): Promise<PostEntity> {
        let toUpdate = posts.find((item) => item.id === Number(data.id));
        if (isNil(toUpdate)) throw new NotFoundException(`the post with id ${data.id} not exits!`);
        toUpdate = { ...toUpdate, ...data };
        posts = posts.map((item) => (item.id === Number(data.id) ? toUpdate : item));
        return toUpdate;
    }

    @Delete(':id')
    async deletePost(@Param('id') id: string): Promise<PostEntity> {
        const toDelete = posts.find((item) => item.id === Number(id));
        if (isNil(toDelete)) throw new NotFoundException(`the post with id ${id} not exits!`);
        posts = posts.filter((item) => item.id !== Number(id));
        return toDelete;
    }
}
