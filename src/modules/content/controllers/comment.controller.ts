import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseUUIDPipe,
    Post,
    Query,
    SerializeOptions,
} from '@nestjs/common';

import { CreateCommentDto, QueryCommentDto, QueryCommentTreeDto } from '../dtos';
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
        console.log('🚀 ~ file: comment.controller.ts:48 ~ CommentController ~ query:', query);
        return this.service.findTrees(query);
    }

    @Delete(':id')
    @SerializeOptions({ groups: ['comment-detail'] })
    async delete(@Param('id', new ParseUUIDPipe()) id: string) {
        return this.service.delete(id);
    }
}
