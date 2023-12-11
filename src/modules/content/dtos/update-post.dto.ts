import { Injectable } from '@nestjs/common';
import { CreatePostDto } from './create-post.dto';
import { IsDefined, IsNumber } from 'class-validator';
import { PartialType } from '@nestjs/swagger';

@Injectable()
export class UpdatePostDto extends PartialType(CreatePostDto) {
    @IsNumber(undefined, { groups: ['update'], message: '帖子ID格式错误' })
    @IsDefined({ groups: ['update'], message: '帖子ID必须指定' })
    id: number;
}
