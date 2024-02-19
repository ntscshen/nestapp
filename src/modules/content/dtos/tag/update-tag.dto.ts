import { PartialType } from '@nestjs/swagger';
import { IsDefined, IsNotEmpty, IsUUID } from 'class-validator';

import { DtoValidation } from '@/modules/core/decorators';

import { CreateTagDto } from './create-tag.dto';

@DtoValidation({ groups: ['update'] })
export class UpdateTagDto extends PartialType(CreateTagDto) {
    /**
     * 待更新ID
     */
    @IsUUID(undefined, { groups: ['update'], message: 'ID格式错误' })
    @IsDefined({ groups: ['update'], message: 'ID必须指定' })
    @IsNotEmpty({ groups: ['update'], message: 'ID必须指定' })
    id: string;
}
