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
    ValidationPipe,
} from '@nestjs/common';

import { CreateTagDto, QueryCategoryDto, UpdateTagDto } from '../dots';
import { TagService } from '../services';

@Controller('tags')
export class TagController {
    constructor(protected service: TagService) {}

    @Post()
    @SerializeOptions({})
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
    @SerializeOptions({})
    async delete(@Param('id', new ParseUUIDPipe()) id: string) {
        return this.service.delete(id);
    }

    @Patch()
    @SerializeOptions({})
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
    @SerializeOptions({})
    async detail(
        @Param('id', new ParseUUIDPipe())
        id: string,
    ) {
        return this.service.detail(id);
    }

    @Get()
    @SerializeOptions({})
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
        options: QueryCategoryDto,
    ) {
        return this.service.paginate(options);
    }
}
