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

import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { Depends } from '@/modules/restful/decorators/depends.decorator';

import { ContentModule } from '../content.module';
import {
    CreateCategoryDto,
    QueryCategoryDto,
    QueryCategoryTreeDto,
    UpdateCategoryDto,
} from '../dtos';
import { DeleteWithTrashDto } from '../dtos/delete-with-trash.dto';
import { RestoreDto } from '../dtos/restore.dto';
import { CategoryService } from '../services/category.service';

@ApiTags('分类操作')
@Depends(ContentModule)
@Controller('categories')
export class CategoryController {
    constructor(protected service: CategoryService) {}

    @Post()
    @SerializeOptions({ groups: ['category-detail'] })
    @ApiOperation({ summary: '创建分类' })
    async create(
        @Body()
        data: CreateCategoryDto,
    ) {
        return this.service.create(data);
    }

    @Patch()
    @ApiOperation({ summary: '更新分类' })
    async update(
        @Body()
        data: UpdateCategoryDto,
    ) {
        return this.service.update(data);
    }

    @Get(':id')
    @SerializeOptions({ groups: ['category-detail'] })
    @ApiOperation({ summary: '分页详情查询' })
    async detail(@Param('id', new ParseUUIDPipe()) id: string) {
        return this.service.detail(id);
    }

    @Get('tree')
    @SerializeOptions({ groups: ['category-tree'] })
    @ApiOperation({ summary: '分类树查询' })
    async findTrees(@Query() options: QueryCategoryTreeDto) {
        console.log('🚀 ~ CategoryController ~ findTrees ~ options:', options);
        return this.service.findTrees(options);
    }

    @Get()
    @SerializeOptions({ groups: ['category-list'] })
    @ApiOperation({ summary: '分类列表查询' })
    async list(
        @Query()
        options: QueryCategoryDto,
    ) {
        return this.service.paginate(options);
    }

    @Delete()
    @SerializeOptions({ groups: ['category-list'] })
    @ApiOperation({ summary: '删除分类' })
    async delete(@Body() data: DeleteWithTrashDto) {
        const { ids, trash } = data;
        return this.service.delete(ids, trash);
    }

    @Patch('restore')
    @ApiOperation({ summary: '还原分类' })
    async restore(@Body() data: RestoreDto) {
        return this.service.restore(data?.ids);
    }
}
