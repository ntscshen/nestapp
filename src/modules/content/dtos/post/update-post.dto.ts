import { PartialType } from '@nestjs/swagger';
import { IsDefined, IsUUID } from 'class-validator';

import { DtoValidation } from '@/modules/core/decorators';

import { CreatePostDto } from './create-post.dto';

@DtoValidation({ groups: ['update'], type: 'body' })
export class UpdatePostDto extends PartialType(CreatePostDto) {
    /**
     * 待更新ID
     */
    @IsUUID(undefined, { groups: ['update'], message: '文章ID格式错误' })
    @IsDefined({ groups: ['update'], message: '文章ID必须指定' })
    id: string;
}
