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

import { ApiTags } from '@nestjs/swagger';

import { Depends } from '@/modules/restful/decorators/depends.decorator';

import { ContentModule } from '../content.module';
import { CreateTagDto, QueryTagDto, UpdateTagDto } from '../dtos';
import { DeleteWithTrashDto } from '../dtos/delete-with-trash.dto';
import { TagService } from '../services';

@ApiTags('标签操作')
@Depends(ContentModule)
@Controller('tags')
export class TagController {
    constructor(protected service: TagService) {}

    /**
     * 添加新标签
     * @param data
     */
    @Post()
    async create(
        @Body()
        data: CreateTagDto,
    ) {
        return this.service.create(data);
    }

    /**
     * 更新标签
     * @param data
     */
    @Patch()
    async update(
        @Body()
        data: UpdateTagDto,
    ) {
        return this.service.update(data);
    }

    /**
     * 分页查询标签列表
     * @param options
     */
    @Get()
    async list(
        @Query()
        options: QueryTagDto,
    ) {
        return this.service.paginate(options);
    }

    /**
     * 查询标签详情
     * @param id
     */
    @Get(':id')
    async detail(@Param('id', new ParseUUIDPipe()) id: string) {
        return this.service.detail(id);
    }

    /**
     * 批量删除标签
     * @param data
     */
    @Delete()
    async delete(@Body() data: DeleteWithTrashDto) {
        const { ids, trash } = data;
        return this.service.delete(ids, trash);
    }

    /**
     * 批量恢复标签
     * @param data
     */
    @Patch('restore')
    async restore(@Body() data: DeleteWithTrashDto) {
        return this.service.restore(data.ids);
    }
}
