import { Transform } from 'class-transformer';
import { IsNumber, IsOptional, Min } from 'class-validator';

import { toNumber } from 'lodash';

import { PaginateOptions } from '@/modules/database/types';

// 标签分页查询验证
export class QueryTagDto implements PaginateOptions {
    @Transform(({ value }) => toNumber(value))
    @Min(1, { message: '当前页必须大于1' })
    @IsNumber()
    @IsOptional()
    page = 1;

    @Transform(({ value }) => toNumber(value))
    @Min(1, { message: '每页显示数据必须大于1' })
    @IsNumber()
    @IsOptional()
    limit: 10;
}
