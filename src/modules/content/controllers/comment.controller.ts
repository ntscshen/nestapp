import { Body, Controller, Delete, Get, Post, Query, SerializeOptions } from '@nestjs/common';

import { CreateCommentDto, QueryCommentDto, QueryCommentTreeDto } from '../dtos';
import { DeleteDto } from '../dtos/delete.dto';
import { CommentService } from '../services/comment.service';

@Controller('comments')
export class CommentController {
    constructor(protected service: CommentService) {}

    @Post()
    @SerializeOptions({ groups: ['comment-detail'] })
    async create(
        @Body()
        data: CreateCommentDto,
    ) {
        return this.service.create(data);
    }

    @Get()
    @SerializeOptions({ groups: ['comment-list'] })
    async list(
        @Query()
        query: QueryCommentDto,
    ) {
        return this.service.paginate(query);
    }

    @Get('tree')
    @SerializeOptions({ groups: ['comment-tree'] })
    async findTree(
        @Query()
        query: QueryCommentTreeDto,
    ) {
        return this.service.findTrees(query);
        // return 'findTree';
    }

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
