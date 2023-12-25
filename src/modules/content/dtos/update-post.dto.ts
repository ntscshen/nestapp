import { Injectable } from '@nestjs/common';

import { PartialType } from '@nestjs/swagger';
import { IsDefined, IsUUID } from 'class-validator';

import { CreatePostDto } from './create-post.dto';

@Injectable()
export class UpdatePostDto extends PartialType(CreatePostDto) {
    @IsUUID(undefined, { groups: ['update'], message: '文章ID格式错误' })
    @IsDefined({ groups: ['update'], message: '文章ID必须指定' })
    id: string;
}
