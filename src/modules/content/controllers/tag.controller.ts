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
    ValidationPipe,
} from '@nestjs/common';

import { AppInterceptor } from '@/modules/core/app.interceptor';

import { CreateTagDto, QueryTagDto, UpdateTagDto } from '../dtos';
import { TagService } from '../services';

@UseInterceptors(AppInterceptor)
@Controller('tags')
export class TagController {
    constructor(protected service: TagService) {}

    @Get()
    async list(
        @Query(
            new ValidationPipe({
                transform: true,
                whitelist: true,
                forbidNonWhitelisted: true,
                forbidUnknownValues: true,
                validationError: { target: false },
            }),
        )
        options: QueryTagDto,
    ) {
        return this.service.paginate(options);
    }

    @Post()
    async create(
        @Body(
            new ValidationPipe({
                transform: true,
                whitelist: true,
                forbidNonWhitelisted: true,
                forbidUnknownValues: true,
                validationError: { target: false },
                groups: ['create'],
            }),
        )
        data: CreateTagDto,
    ) {
        return this.service.create(data);
    }

    @Delete(':id')
    async delete(@Param('id', new ParseUUIDPipe()) id: string) {
        return this.service.delete(id);
    }

    @Patch()
    async update(
        @Body(
            new ValidationPipe({
                transform: true,
                whitelist: true,
                forbidNonWhitelisted: true,
                forbidUnknownValues: true,
                validationError: { target: false },
                groups: ['update'],
            }),
        )
        data: UpdateTagDto,
    ) {
        return this.service.update(data);
    }

    @Get(':id')
    async detail(@Param('id', new ParseUUIDPipe()) id: string) {
        return this.service.detail(id);
    }
}
