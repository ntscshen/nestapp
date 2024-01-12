import { Transform } from 'class-transformer';

import { IsEnum, IsNumber, IsOptional, Min } from 'class-validator';

import { toNumber } from 'lodash';

import { DtoValidation } from '@/modules/core/decorators';
import { PaginateOptions } from '@/modules/database/types';

import { SelectTrashMode } from '../../constants';

@DtoValidation({ type: 'query' })
export class QueryCategoryTreeDto {
    @IsEnum(SelectTrashMode)
    @IsOptional()
    trashed?: SelectTrashMode;
}

@DtoValidation({ type: 'query' })
export class QueryCategoryDto extends QueryCategoryTreeDto implements PaginateOptions {
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
