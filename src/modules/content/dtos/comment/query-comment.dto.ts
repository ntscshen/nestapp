import { PickType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNumber, IsOptional, IsUUID, Min } from 'class-validator';

import { toNumber } from 'lodash';

import { DtoValidation } from '@/modules/core/decorators';
import { PaginateOptions } from '@/modules/database/types';

/**
 * 评论分页查询验证
 */
@DtoValidation({ type: 'query' })
export class QueryCommentDto implements PaginateOptions {
    /**
     * 评论
     */
    @IsUUID(undefined, { message: 'ID格式错误' })
    @IsOptional()
    post?: string;

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
}
/**
 * 评论树查询
 */
@DtoValidation({ type: 'query' })
export class QueryCommentTreeDto extends PickType(QueryCommentDto, ['post']) {}
