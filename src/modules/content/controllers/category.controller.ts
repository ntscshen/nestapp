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

import {
    CreateCategoryDto,
    QueryCategoryDto,
    QueryCategoryTreeDto,
    UpdateCategoryDto,
} from '../dtos';
import { DeleteWithTrashDto } from '../dtos/delete-with-trash.dto';
import { CategoryService } from '../services/category.service';
import { RestoreDto } from '../dtos/restore.dto';

@Controller('categories')
export class CategoryController {
    constructor(protected service: CategoryService) {}

    @Post()
    @SerializeOptions({ groups: ['category-detail'] })
    async create(
        @Body()
        data: CreateCategoryDto,
    ) {
        return this.service.create(data);
    }

    @Patch()
    async update(
        @Body()
        data: UpdateCategoryDto,
    ) {
        return this.service.update(data);
    }

    @Get(':id')
    @SerializeOptions({ groups: ['category-detail'] })
    async detail(@Param('id', new ParseUUIDPipe()) id: string) {
        return this.service.detail(id);
    }

    @Get('tree')
    @SerializeOptions({ groups: ['category-tree'] })
    async findTrees(@Query() options: QueryCategoryTreeDto) {
        return this.service.findTrees(options);
    }

    @Get()
    @SerializeOptions({ groups: ['category-list'] })
    async list(
        @Query()
        options: QueryCategoryDto,
    ) {
        return this.service.paginate(options);
    }

    @Delete()
    @SerializeOptions({ groups: ['category-list'] })
    async delete(@Body() data: DeleteWithTrashDto) {
        const { ids, trash } = data;
        return this.service.delete(ids, trash);
    }

    @Patch('restore')
    async restore(@Body() data: RestoreDto) {
        return this.service.restore(data?.ids);
    }
}
