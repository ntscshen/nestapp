import { Transform } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, Min } from 'class-validator';

import { toNumber } from 'lodash';

import { DtoValidation } from '@/modules/core/decorators';
import { PaginateOptions } from '@/modules/database/types';

import { SelectTrashMode } from '../../constants';

// 标签分页查询验证
@DtoValidation({ type: 'query' })
export class QueryTagDto implements PaginateOptions {
    /**
     * 当前页
     */
    @Transform(({ value }) => toNumber(value))
    @Min(1, { message: '当前页必须大于1' })
    @IsNumber()
    @IsOptional()
    page?: number = 1;

    /**
     * 每页显示数据
     */
    @Transform(({ value }) => toNumber(value))
    @Min(1, { message: '每页显示数据必须大于1' })
    @IsNumber()
    @IsOptional()
    limit?: number = 10;

    /**
     * 根据软删除状态查询
     */
    @IsEnum(SelectTrashMode)
    @IsOptional()
    trashed?: SelectTrashMode;
}
