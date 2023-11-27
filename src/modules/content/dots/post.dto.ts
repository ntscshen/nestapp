// 数据验证
import { PartialType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
    IsBoolean,
    IsDateString,
    IsDefined,
    IsEnum,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsUUID,
    MaxLength,
    Min,
    ValidateIf,
} from 'class-validator';

import { isNil, toNumber } from 'lodash';

import { toBoolean } from '@/modules/core/helpers';
import { PaginateOptions } from '@/modules/database/types';

import { PostOrderType } from '../constants';

// 文章分页查询验证
export class QueryPostDto implements PaginateOptions {
    @Transform(({ value }) => toBoolean(value))
    @IsBoolean()
    @IsOptional()
    isPublished?: boolean;
    // 代码确保了“isPublished”属性在被使用之前会被转换成一个布尔值，并且它是可选的。
    // 代码确保了“isPublished”属性在被使用之前会被转换成一个布尔值，并且它是可选的。
    // 代码确保了“isPublished”属性在被使用之前会被转换成一个布尔值，并且它是可选的。

    // 这个装饰器确保orderBy属性是PostOrderType枚举中的一个值。如果不是，它会返回一个错误消息， 该消息是通过PostOrderType枚举的所有值生成的。
    @IsEnum(PostOrderType, {
        message: `排序规则必须是 ${Object.values(PostOrderType).join(',')}其中一项`,
    })
    @IsOptional() // 这个装饰器表示orderBy属性是可选的，即它没有被明确赋值时不会引发验证错误。
    orderBy?: PostOrderType;

    @Transform(({ value }) => toNumber(value)) // 将属性值转换为数字。
    @Min(1, { message: '当前页必须大于1' }) // 确保“page”的值至少为1，否则会返回指定的错误消息。
    @IsNumber() // 验证“page”的值是否为数字。
    @IsOptional() // 表明“page”属性是可选的。
    page = 1;
    // 最后，page = 1;表示默认值为1。
    // 这些装饰器将按照顺序执行，确保属性值是数字、至少为1，并且是可选的。如果你在应用中有任何与这个属性相关的具体问题或错误，请提供更多的上下文信息，以便我能更准确地帮助你解决问题。

    @Transform(({ value }) => toNumber(value)) // 这个装饰器用于转换属性值。它将尝试将limit的值转换为数字。
    @Min(1, { message: '每页显示数据必须大于1' }) // 这个装饰器确保limit的值至少为1。如果小于1，将返回指定的错误消息。
    @IsNumber() // 这个装饰器验证limit是否是一个数字。
    @IsOptional() // 这个装饰器表明limit属性是可选的。
    limit: number = 10;
    // 默认值limit: number = 10;指定了在没有明确设定limit值时，其默认值为10。
    // 这些装饰器将按照它们出现的顺序执行。首先，如果提供了一个值，它将通过toNumber函数转换，然后验证它是否是一个数字，是否至少为1，并且它是可选的。

    @IsUUID(undefined, { message: 'ID格式错误' })
    @IsOptional()
    category?: string;

    @IsUUID(undefined, { message: 'ID格式错误' })
    @IsOptional()
    tag?: string;
}
// 文章创建验证
export class CreatePostDto {
    // 创建文章，标题是必填的，更新文章，标题是可选的。
    @MaxLength(255, {
        always: true,
        message: '文章标题长度最大为 $constraint1',
    })
    @IsNotEmpty({ groups: ['create'], message: '文化标题必须填写' })
    @IsOptional({ groups: ['update'] })
    title: string;

    // 创建文章时body属性必填，更新文章时，可选的
    @IsNotEmpty({ groups: ['create'], message: '文章内容必须填写' })
    @IsOptional({ groups: ['update'] })
    body: string;

    // 这个装饰器用来限制summary属性的长度。
    @MaxLength(500, {
        always: true,
        message: '文章描述长度最大为 $constraint1',
    })
    @IsOptional({ always: true })
    summary?: string; // 概要

    @IsDateString({ strict: true }, { always: true })
    @IsOptional({ always: true })
    @ValidateIf((value) => !isNil(value.publishedAt))
    @Transform(({ value }) => (value === 'null' ? null : value))
    publishedAt?: Date;

    @MaxLength(20, {
        each: true,
        always: true,
        message: '每个关键字长度最大为 $constraint1',
    })
    @IsOptional({ always: true })
    keywords?: string[];

    @Transform(({ value }) => toNumber(value))
    @Min(0, { always: true, message: '排序值必须大于0' })
    @IsNumber(undefined, { always: true })
    @IsOptional({ always: true })
    customOrder = 0;

    @IsUUID(undefined, {
        each: true,
        always: true,
        message: 'ID格式不正确',
    })
    @IsOptional({ groups: ['update'] })
    category?: string; // 创建 f41816d0-8924-11ee-b9d1-0242ac120003

    @IsNotEmpty({ groups: ['create'], message: '分类必须设置' })
    @IsOptional({ always: true })
    tags?: string[];
}

// 文章更新验证
// Update中的属性都继承自CreateDto，所以会出现一种情况，就是CreateDto中的所有必须属性，也会成为UpdateDto的必选类型
// 所以使用 PartialType 将所有属性变为可选属性
export class UpdatePostDto extends PartialType(CreatePostDto) {
    // 这两个装饰器都用了{ groups: ['update'] }选项，这意味着这些验证只在update组被触发。
    @IsUUID(undefined, { groups: ['update'], message: '文章ID格式错误' }) // 检查id是否是有效的UUID。
    @IsDefined({ groups: ['update'], message: '文章ID必须指定' }) // 装饰器检查id是否被定义。
    id: string;
}
