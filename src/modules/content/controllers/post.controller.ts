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

import { CreatePostDto, QueryPostDto, UpdatePostDto } from '../dtos';
import { DeleteWithTrashDto } from '../dtos/delete-with-trash.dto';
import { RestoreDto } from '../dtos/restore.dto';
import { PostService } from '../services/post.service';

@Controller('posts')
export class PostController {
    constructor(protected service: PostService) {}

    @Post()
    @SerializeOptions({ groups: ['post-detail'] })
    async create(
        @Body()
        data: CreatePostDto,
    ) {
        return this.service.create(data);
    }

    @Patch()
    @SerializeOptions({ groups: ['post-detail'] })
    async update(
        @Body()
        data: UpdatePostDto,
    ) {
        await this.service.update(data);
        return this.service.detail(data.id);
    }

    @Get(':id')
    @SerializeOptions({ groups: ['post-detail'] })
    async detail(
        @Param('id', new ParseUUIDPipe())
        id: string,
    ) {
        return this.service.detail(id);
    }

    @Get()
    @SerializeOptions({ groups: ['post-list'] })
    async list(
        @Query()
        options: QueryPostDto,
    ) {
        return this.service.paginate(options);
    }

    @Delete()
    @SerializeOptions({ groups: ['post-list'] })
    async delete(@Body() data: DeleteWithTrashDto) {
        const { ids, trash } = data;
        return this.service.delete(ids, trash);
    }

    @Patch('restore')
    @SerializeOptions({ groups: ['post-list'] })
    async restore(@Body() data: RestoreDto) {
        return this.service.restore(data?.ids);
    }
}
