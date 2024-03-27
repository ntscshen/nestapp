import { IsEnum, IsOptional } from 'class-validator';

import { SelectTrashMode } from '@/modules/content/constants';
import { PaginateDto } from '@/modules/content/dtos/paginate.dto';
import { DtoValidation } from '@/modules/core/decorators';

@DtoValidation({ type: 'query' })
export class PaginateWithTrashedDto extends PaginateDto {
    /**
     * 软删除状态
     */
    @IsOptional()
    @IsEnum(SelectTrashMode)
    trashed?: SelectTrashMode;
}
