import { Transform } from 'class-transformer';

import { IsBoolean, IsEnum, IsNumber, IsOptional, Min } from 'class-validator';

import { toNumber } from 'lodash';

import { toBoolean } from '@/modules/core/utils';
import { PaginateOptions } from '@/modules/database/types';

import { PostOrderType } from '../constants';

/**
 * 文章分页查询验证
 */
export class QueryPostDto implements PaginateOptions {
    @Transform(({ value }) => toBoolean(value))
    @IsBoolean()
    @IsOptional()
    isPublished?: boolean;

    @IsEnum(PostOrderType, {
        message: `排序规则必须是${Object.values(PostOrderType).join(',')}其中一项`,
    })
    @IsOptional()
    orderBy?: PostOrderType;

    @Transform(({ value }) => toNumber(value))
    @Min(1, { message: '当前页必须大于1' })
    @IsNumber()
    @IsOptional()
    page = 1;

    @Transform(({ value }) => toNumber(value))
    @Min(1, { message: '每页显示数据必须大于1' })
    @IsNumber()
    @IsOptional()
    limit = 10;
}
