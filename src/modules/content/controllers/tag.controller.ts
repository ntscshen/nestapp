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
} from '@nestjs/common';

import { CreateTagDto, QueryTagDto, UpdateTagDto } from '../dtos';
import { DeleteWithTrashDto } from '../dtos/delete-with-trash.dto';
import { TagService } from '../services';

@Controller('tags')
export class TagController {
    constructor(protected service: TagService) {}

    @Post()
    async create(
        @Body()
        data: CreateTagDto,
    ) {
        return this.service.create(data);
    }

    @Patch()
    async update(
        @Body()
        data: UpdateTagDto,
    ) {
        return this.service.update(data);
    }

    @Get()
    async list(
        @Query()
        options: QueryTagDto,
    ) {
        console.log('🚀 ~ file: tag.controller.ts:45 ~ TagController ~ options:', options);
        return this.service.paginate(options);
    }

    @Get(':id')
    async detail(@Param('id', new ParseUUIDPipe()) id: string) {
        return this.service.detail(id);
    }

    @Delete()
    async delete(@Body() data: DeleteWithTrashDto) {
        const { ids, trash } = data;
        return this.service.delete(ids, trash);
    }

    @Patch('restore')
    async restore(@Body() data: DeleteWithTrashDto) {
        return this.service.restore(data.ids);
    }
}
