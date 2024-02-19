import { Transform } from 'class-transformer';

import { IsBoolean, IsEnum, IsNumber, IsOptional, IsUUID, MaxLength, Min } from 'class-validator';

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
    /**
     * 全文搜索
     */
    @MaxLength(100, {
        always: true,
        message: '搜索字符串长度不得超过$constraint1',
    })
    @IsOptional({ always: true })
    search?: string;

    /**
     * 是否查询已发布(全部文章:不填、只查询已发布的:true、只查询未发布的:false)
     */
    @Transform(({ value }) => toBoolean(value))
    @IsBoolean()
    @IsOptional()
    isPublished?: boolean;

    /**
     * 查询结果排序,不填则综合排序
     */
    @IsEnum(PostOrderType, {
        message: `排序规则必须是${Object.values(PostOrderType).join(',')}其中一项`,
    })
    @IsOptional()
    orderBy?: PostOrderType;

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
     * 根据分类ID查询此分类及其后代分类下的文章
     */
    @IsUUID(undefined, { message: '分类ID格式错误' })
    @IsOptional()
    category?: string;

    /**
     * 根据管理标签ID查询
     */
    @IsUUID(undefined, { message: 'ID格式错误' })
    @IsOptional()
    tag?: string;

    @IsEnum(SelectTrashMode, {
        message: `软删除模式必须是${Object.values(SelectTrashMode).join(',')}`,
    })
    @IsOptional()
    trashed?: SelectTrashMode;
}
