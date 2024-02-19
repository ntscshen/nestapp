import { Transform } from 'class-transformer';
import { IsDefined, IsNotEmpty, IsOptional, IsUUID, MaxLength, ValidateIf } from 'class-validator';

import { DtoValidation } from '@/modules/core/decorators';

@DtoValidation()
export class CreateCommentDto {
    /**
     * 评论内容
     */
    @MaxLength(1000, { message: '评论内容不能超过$constraint1个字' })
    @IsNotEmpty({ message: '评论内容不能为空' })
    body: string;

    /**
     * 评论
     */
    @IsUUID(undefined, { message: 'ID格式错误' })
    @IsDefined({ message: 'ID必须指定' })
    post: string;

    /**
     * 父级评论
     */
    @IsUUID(undefined, { always: true, message: 'ID格式错误' })
    @ValidateIf((value) => value.parent !== null && value.parent)
    @IsOptional({ always: true })
    @Transform(({ value }) => (value === 'null' ? null : value))
    parent?: string;
}
