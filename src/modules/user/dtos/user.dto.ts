// PickType: 一个高阶函数，用于从一个类型中选择一组属性来创建一个新类型。
import { PartialType, PickType } from '@nestjs/swagger';

import { IsDefined, IsEnum, IsUUID } from 'class-validator';

import { DtoValidation } from '@/modules/core/decorators';

import { PaginateWithTrashedDto } from '@/modules/restful/dtos/paginate-with-trashed.dto';

import { UserOrderType, UserValidateGroup } from '../constant';

import { UserCommonDto } from './common.dto';

/**
 * 创建用的请求数据验证
 */
@DtoValidation({ groups: [UserValidateGroup.CREATE] })
export class CreateUserDto extends PickType(UserCommonDto, [
    'username',
    'nickname',
    'password',
    'phone',
    'email',
]) {}

/**
 * 更新用的请求数据验证
 */
@DtoValidation({ groups: [UserValidateGroup.UPDATE] })
export class UpdateUserDto extends PartialType(CreateUserDto) {
    // partial（形容词）部分的，不完全的。
    /**
     * 待更新的用户ID
     * */
    @IsUUID(undefined, { groups: [UserValidateGroup.UPDATE], message: '用户ID格式不正确' })
    @IsDefined({ groups: [UserValidateGroup.UPDATE], message: '用户ID不能为空' })
    id: string;
}

@DtoValidation({ type: 'query' })
export class QueryUserDto extends PaginateWithTrashedDto {
    /**
     * 排序规则:可指定用户列表的排序规则,默认为按创建时间降序排序
     */
    @IsEnum(UserOrderType)
    orderBy: UserOrderType;
}
