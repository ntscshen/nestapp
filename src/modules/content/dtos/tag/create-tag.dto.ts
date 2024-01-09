import { IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

import { DtoValidation } from '@/modules/core/decorators';

@DtoValidation({ groups: ['create'] })
export class CreateTagDto {
    @MaxLength(255, {
        always: true,
        message: '标签名称长度最大为$constraint1',
    })
    @IsNotEmpty({ groups: ['create'], message: '标签名称必须填写' })
    @IsOptional({ groups: ['update'] })
    name: string;

    @MaxLength(500, {
        always: true,
        message: '标签描述长度最大为$constraint1',
    })
    @IsOptional({ always: true })
    description?: string;
}
