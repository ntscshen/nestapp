import { Transform } from 'class-transformer';

import { IsBoolean, IsEnum, IsNumber, IsOptional, IsUUID, Min } from 'class-validator';

import { toNumber } from 'lodash';

import { DtoValidation } from '@/modules/core/decorators';
import { toBoolean } from '@/modules/core/utils';
import { PaginateOptions } from '@/modules/database/types';

import { PostOrderType, SelectTrashMode } from '../../constants';

/**
 * 文章分页查询验证
 */
@DtoValidation({ type: 'query' })
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

    @IsUUID(undefined, { message: '分类ID格式错误' })
    @IsOptional()
    category?: string;

    @IsUUID(undefined, { message: 'ID格式错误' })
    @IsOptional()
    tag?: string;

    @IsEnum(SelectTrashMode, {
        message: `软删除模式必须是${Object.values(SelectTrashMode).join(',')}`,
    })
    @IsOptional()
    trashed?: SelectTrashMode;
}
