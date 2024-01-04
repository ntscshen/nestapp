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
    UseInterceptors,
    ValidationPipe,
} from '@nestjs/common';

import { AppInterceptor } from '@/modules/core/app.interceptor';

import { CreateCategoryDto, QueryCategoryDto, UpdateCategoryDto } from '../dtos';
import { CategoryService } from '../services/category.service';

@UseInterceptors(AppInterceptor) // 后置拦截器
@Controller('categories')
export class CategoryController {
    constructor(protected service: CategoryService) {}

    @Post()
    // @SerializeOptions({ groups: ['category-detail'] })
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
        data: CreateCategoryDto,
    ) {
        return this.service.create(data);
    }

    @Delete(':id')
    @SerializeOptions({ groups: ['category-detail'] })
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
        data: UpdateCategoryDto,
    ) {
        return this.service.update(data);
    }

    @Get(':id')
    @SerializeOptions({ groups: ['category-detail'] })
    async detail(@Param('id', new ParseUUIDPipe()) id: string) {
        return this.service.detail(id);
    }

    @Get()
    @SerializeOptions({ groups: ['category-list'] })
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

    @Get('tree')
    @SerializeOptions({ groups: ['category-tree'] })
    async findTrees() {
        return this.service.findTrees();
    }
}
