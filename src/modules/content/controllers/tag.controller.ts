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
    UseInterceptors,
} from '@nestjs/common';

import { AppInterceptor } from '@/modules/core/providers/app.interceptor';

import { CreateTagDto, QueryTagDto, UpdateTagDto } from '../dtos';
import { TagService } from '../services';

@UseInterceptors(AppInterceptor)
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

    @Delete(':id')
    async delete(@Param('id', new ParseUUIDPipe()) id: string) {
        return this.service.delete(id);
    }
}
