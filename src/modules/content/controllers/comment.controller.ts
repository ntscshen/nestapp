import { Body, Controller, Delete, Get, Post, Query, SerializeOptions } from '@nestjs/common';

import { ApiTags } from '@nestjs/swagger';

import { Depends } from '@/modules/restful/decorators/depends.decorator';

import { ContentModule } from '../content.module';
import { CreateCommentDto, QueryCommentDto, QueryCommentTreeDto } from '../dtos';
import { DeleteDto } from '../dtos/delete.dto';
import { CommentService } from '../services/comment.service';

@ApiTags('评论操作')
@Depends(ContentModule)
@Controller('comments')
export class CommentController {
    constructor(protected service: CommentService) {}

    /**
     * 新增评论
     * @param data
     */
    @Post()
    @SerializeOptions({ groups: ['comment-detail'] })
    async create(
        @Body()
        data: CreateCommentDto,
    ) {
        return this.service.create(data);
    }

    /**
     * 分页查询评论列表
     * @param query
     */
    @Get()
    @SerializeOptions({ groups: ['comment-list'] })
    async list(
        @Query()
        query: QueryCommentDto,
    ) {
        return this.service.paginate(query);
    }

    /**
     * 查询评论树
     * @param query
     */
    @Get('tree')
    @SerializeOptions({ groups: ['comment-tree'] })
    async findTree(
        @Query()
        query: QueryCommentTreeDto,
    ) {
        return this.service.findTrees(query);
    }

    /**
     * 批量删除评论
     * @param data
     */
    @Delete()
    @SerializeOptions({ groups: ['comment-list'] })
    async delete(
        @Body()
        data: DeleteDto,
    ) {
        const { ids } = data;
        return this.service.delete(ids);
    }
}
