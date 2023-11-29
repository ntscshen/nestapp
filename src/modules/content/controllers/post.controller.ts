import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseUUIDPipe,
    Patch,
    Post,
    Query,
    SerializeOptions,
} from '@nestjs/common';

import { CreatePostDto, QueryPostDto, UpdatePostDto } from '../dots/post.dto';
import { PostService } from '../services';

// interceptor /ɪntə'septə/ n.拦截机
@Controller('posts')
export class PostController {
    constructor(private postService: PostService) {}

    // 有了 DTO 之后不代表可以自动对请求数据进行验证
    @Post()
    @SerializeOptions({ groups: ['post-create'] })
    async create(
        @Body()
        data: CreatePostDto,
    ) {
        return this.postService.create(data);
    }

    @Delete(':id')
    async delete(@Param('id', new ParseUUIDPipe()) id: string) {
        return this.postService.delete(id);
    }

    @Patch()
    @SerializeOptions({ groups: ['post-detail'] })
    async update(
        @Body()
        data: UpdatePostDto,
    ) {
        return this.postService.update(data);
    }

    @Get(':id')
    @SerializeOptions({ groups: ['post-detail'] })
    async detail(@Param('id', new ParseUUIDPipe()) id: string) {
        return this.postService.detail(id);
    }

    @Get()
    @SerializeOptions({ groups: ['post-list'] })
    async list(
        @Query()
        options: QueryPostDto,
    ) {
        return this.postService.paginate(options);
    }
}
