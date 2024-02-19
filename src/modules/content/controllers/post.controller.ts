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

import { ApiTags } from '@nestjs/swagger';

import { Depends } from '@/modules/restful/decorators/depends.decorator';

import { ContentModule } from '../content.module';
import { CreatePostDto, QueryPostDto, UpdatePostDto } from '../dtos';
import { DeleteWithTrashDto } from '../dtos/delete-with-trash.dto';
import { RestoreDto } from '../dtos/restore.dto';
import { PostService } from '../services/post.service';

@ApiTags('文章操作')
@Depends(ContentModule)
@Controller('posts')
export class PostController {
    constructor(protected service: PostService) {}

    /**
     * 新增文章
     * @param data
     */
    @Post()
    @SerializeOptions({ groups: ['post-detail'] })
    async create(
        @Body()
        data: CreatePostDto,
    ) {
        return this.service.create(data);
    }

    /**
     * 更新文章
     * @param data
     */
    @Patch()
    @SerializeOptions({ groups: ['post-detail'] })
    async update(
        @Body()
        data: UpdatePostDto,
    ) {
        await this.service.update(data);
        return this.service.detail(data.id);
    }

    /**
     * 查询文章详情
     * @param id
     */
    @Get(':id')
    @SerializeOptions({ groups: ['post-detail'] })
    async detail(
        @Param('id', new ParseUUIDPipe())
        id: string,
    ) {
        return this.service.detail(id);
    }

    /**
     * 分页查询文章列表
     * @param options
     */
    @Get()
    @SerializeOptions({ groups: ['post-list'] })
    async list(
        @Query()
        options: QueryPostDto,
    ) {
        return this.service.paginate(options);
    }

    /**
     * 批量删除文章
     * @param data
     */
    @Delete()
    @SerializeOptions({ groups: ['post-list'] })
    async delete(@Body() data: DeleteWithTrashDto) {
        const { ids, trash } = data;
        return this.service.delete(ids, trash);
    }

    /**
     * 批量恢复文章
     * @param data
     */
    @Patch('restore')
    @SerializeOptions({ groups: ['post-list'] })
    async restore(@Body() data: RestoreDto) {
        return this.service.restore(data?.ids);
    }
}
