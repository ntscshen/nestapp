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
    @Transform(({ value }) => toBoolean(value)) // 个装饰器确保属性值被转换为布尔值。toBoolean函数将把任何值转换为布尔值，例如字符串"true"或"false"会被转换为对应的布尔值。
    @IsBoolean() // 这个装饰器验证属性是否已经是一个布尔值。如果不是，它将抛出一个验证错误。
    @IsOptional() // 个装饰器表明“isPublished”属性是可选的，即它没有被设置时，不会触发验证错误。
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

/*
@Transform 为数值转换自定义逻辑，只能应用于属性
@Min 检查数值是否大于或等于允许的最小值
@IsEnum 检查給定的值是否w是所提供枚举的成员
@IsBoolean 检查数值是否为布尔值
@IsNumber 检查数值是否为数字
@IsOptional 检查是否缺少值，如果缺少，则忽略所有验证器

@IsNotEmpty 检查給定值是否为空( !== '', !==null, !== undefined )
@IsDateString IsISO8601 验证器的别名。 严格模式下，日期的格式必须完全符合ISO 8601标准（例如："2023-07-29T12:34:56.789Z"）。always: true表示不论属性值是什么，都会进行此验证。
@ValidateIf 当提供的条件函数返回 false 时，忽略属性上的其他验证器。
*/
// constraint n.强制，约束

// 文章创建验证
export class CreatePostDto {
    // 这个装饰器用来确保title属性的长度不会超过255个字符。
    @MaxLength(2553, {
        always: true, // always: true表示此验证规则始终适用，无论属性是否定义。
        message: '文章标题长度最大为 $constraint1', // 如果验证失败，将返回消息"文章标题长度最大为 255"，其中"$constraint1"会被替换为255。
    })
    // 这个装饰器用来确保在"create"操作组中，title属性不是空的。如果在"create"组中该属性为空，将返回消息"文化标题必须填写"。
    @IsNotEmpty({ groups: ['create'], message: '文化标题必须填写' })
    @IsOptional({ groups: ['update'] }) // 这个装饰器表示，在"update"操作组中，title属性是可选的。
    title: string;
    // 在创建文章("create"组)时，标题是必填的，长度不能超过255个字符。
    // 在更新文章("update"组)时，标题是可选的。
    // 无论何时，如果标题的长度超过255个字符，都会收到一个长度超限的错误消息。

    // 这个装饰器用于验证body属性是否非空。特别是当验证组是'create'时，如果body是空的，将返回定义的错误消息"文章内容必须填写"。
    @IsNotEmpty({ groups: ['create'], message: '文章内容必须填写' })
    @IsOptional({ groups: ['update'] }) // // 这个装饰器表示，当验证组是'update'时，body属性是可选的。也就是说，在更新操作时，这个字段是可以被省略的。
    body: string; // 这里定义了属性body，其类型为字符串。
    // 这段代码确保在创建文章时body属性是必填的，并且不能为空。但在更新文章时，它是可选的，可以被省略。
    // 这段代码确保在创建文章时body属性是必填的，并且不能为空。但在更新文章时，它是可选的，可以被省略。
    // 这段代码确保在创建文章时body属性是必填的，并且不能为空。但在更新文章时，它是可选的，可以被省略。

    // 这个装饰器用来限制summary属性的长度。
    @MaxLength(500, {
        always: true, // always: true意味着这个验证会在每次使用时进行。
        // 它确保summary属性的长度不会超过500个字符。
        message: '文章描述长度最大为 $constraint1', // 如果超过了，就会显示提供的消息，其中$constraint1会被替换为500。
    })
    // summary? 字段是可选的，创建或使用这个 DTO 对象时，你可以选择性地同 summary 字段的值，也可以不提供
    // 由于有 @IsOptional({ always: true }) 这个装饰器，无论 summary 字段传递了什么值( 包括undefined 和 null )，都不会触发错误
    @IsOptional({ always: true }) // 这个装饰器表示summary属性是可选的。即使这个属性没有被设置，也不会报错。always: true表示这个规则始终适用。
    summary?: string; // 这里定义了summary属性，它是一个可选的字符串。
    // 你的summary属性是一个可选的字符串，它的最大长度是500个字符。如果你尝试设置一个超过500个字符的值，你会收到一个错误消息，消息内容为："文章描述长度最大为 500"。
    // 你的summary属性是一个可选的字符串，它的最大长度是500个字符。如果你尝试设置一个超过500个字符的值，你会收到一个错误消息，消息内容为："文章描述长度最大为 500"。
    // 你的summary属性是一个可选的字符串，它的最大长度是500个字符。如果你尝试设置一个超过500个字符的值，你会收到一个错误消息，消息内容为："文章描述长度最大为 500"。

    @IsDateString({ strict: true }, { always: true }) // ：此装饰器用于检查publishedAt是否是一个严格的日期字符串。
    @IsOptional({ always: true }) // 此装饰器表示publishedAt属性是可选的。也就是说，此属性可以被省略或者其值可以是undefined。
    // isNil 用于检查其参数是否为 null 或 undefined。
    @ValidateIf((value) => !isNil(value.publishedAt)) // 此装饰器用于在属性值不为null或undefined时进行验证。它确保只有当publishedAt有实际值时，才会进行后续的验证。
    @Transform(({ value }) => (value === 'null' ? null : value)) // 此装饰器用于转换属性值。如果属性值等于字符串'null'，它会被转换为null。否则，属性值保持不变。
    publishedAt?: Date; // ：这里定义了publishedAt属性，其类型是Date。问号表示这个属性是可选的，即它可能不存在或者其值可能是undefined。
    // 1. 这段代码定义了一个名为publishedAt的可选日期属性。当提供此属性时，它必须是一个严格的ISO日期字符串。如果提供的值是'null'字符串，那么它会被自动转换为null。
    // 其他的值会被保持不变。如果未提供此属性，那么其值会是undefined，并且不会触发任何验证错误。
    // 2. 这段代码定义了一个名为publishedAt的可选日期属性。当提供此属性时，它必须是一个严格的ISO日期字符串。如果提供的值是'null'字符串，那么它会被自动转换为null。
    // 其他的值会被保持不变。如果未提供此属性，那么其值会是undefined，并且不会触发任何验证错误。
    // 3. 这段代码定义了一个名为publishedAt的可选日期属性。当提供此属性时，它必须是一个严格的ISO日期字符串。如果提供的值是'null'字符串，那么它会被自动转换为null。
    // 其他的值会被保持不变。如果未提供此属性，那么其值会是undefined，并且不会触发任何验证错误。

    // 这个装饰器限制keywords数组中的每个字符串元素的长度不能超过20个字符。
    // @Exclude()
    @MaxLength(20, {
        each: true, // each: true表示这个限制应用到数组的每个元素。
        always: true, // always: true表示这个验证总是执行，即使属性值是undefined
        message: '每个关键字长度最大为 $constraint1', // message提供了当验证失败时要显示的消息。
    })
    @IsOptional({ always: true }) // 这个装饰器表明keywords属性是可选的，即使其值为undefined，也不会报错。
    keywords?: string[];
    // 你的keywords属性可以是一个包含长度不超过20的字符串的数组，或者完全未定义。如果你尝试将长度超过20的字符串添加到该数组，或者提供一个非数组的值，那么验证器将会显示一个错误消息："每个关键字长度最大为 20"。
    // 你的keywords属性可以是一个包含长度不超过20的字符串的数组，或者完全未定义。如果你尝试将长度超过20的字符串添加到该数组，或者提供一个非数组的值，那么验证器将会显示一个错误消息："每个关键字长度最大为 20"。
    // 你的keywords属性可以是一个包含长度不超过20的字符串的数组，或者完全未定义。如果你尝试将长度超过20的字符串添加到该数组，或者提供一个非数组的值，那么验证器将会显示一个错误消息："每个关键字长度最大为 20"。

    @Transform(({ value }) => toNumber(value)) // 这个装饰器是用于转换值的。它把customOrder的值转换为数字。
    @Min(0, { always: true, message: '排序值必须大于0' }) // 这个装饰器保证customOrder的值至少为0。
    @IsNumber(undefined, { always: true }) // 这个装饰器保证customOrder的值是一个数字。
    @IsOptional({ always: true }) // 这个装饰器表示customOrder是可选的。
    customOrder = 0;
    // 创建了一个名为customOrder的属性，其初始值为0。它确保了该属性的值始终为数字，并且至少为0，同时这个属性是可选的。

    @IsUUID(undefined, {
        each: true,
        always: true,
        message: 'ID格式不正确',
    })
    @IsOptional({ groups: ['update'] })
    category?: string; // 创建

    // TypeScript类型定义中的可选（使用问号表示）与class-validator验证的可选是不同的。要确保验证的可选性，需要正确使用@IsOptional装饰器。
    // category在TypeScript定义上是可选的，你仍然需要使用@IsOptional装饰器来确保它在特定的验证组下是可选的。
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
