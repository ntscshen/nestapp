// 用户模块DTO的通用基础字段

import { IsEmail, IsNotEmpty, IsOptional, Length } from 'class-validator';

import { IsMatch } from '@/modules/core/constraints/match.constraint';
import { IsMatchPhone } from '@/modules/core/constraints/match.phone.constraint';
import { IsPassword } from '@/modules/core/constraints/password.constraint';
import { IsUnique } from '@/modules/database/constraints/unique.constraint';
import { IsUniqueExist } from '@/modules/database/constraints/unique.exist.constraint';

import { UserValidateGroup } from '../constant';
import { UserEntity } from '../entities/user.entity';

/**
 * 用户模块DTO的通用基础字段
 */
export class UserCommonDto {
    /**
     * 登录凭证:可以是用户名,手机号,邮箱地址
     */
    @Length(4, 30, {
        message: '登录凭证长度必须为$constraint1到$constraint2',
        always: true,
    })
    @IsNotEmpty({ always: true, message: '用户登录凭证不能为空' })
    credential: string;

    /**
     * 用户名
     * */
    @IsOptional({ groups: [UserValidateGroup.UPDATE] })
    @Length(4, 30, {
        always: true,
        message: '用户名长度必须为$constraint1到$constraint2-30位',
    })
    @IsUnique(
        // 确保数据库中指定字段的值是唯一的
        { entity: UserEntity },
        {
            groups: [UserValidateGroup.CREATE],
            message: '该用户名已被注册',
        },
    )
    @IsUniqueExist(
        { entity: UserEntity, ignore: 'id' },
        {
            groups: [UserValidateGroup.UPDATE],
            message: '该用户名已被注册',
        },
    )
    username: string;

    /**
     * 昵称: 不设置则使用用户名
     * */
    @IsOptional({ always: true })
    @Length(3, 20, {
        always: true,
        message: '昵称必须为$constraint1到$constraint2',
    })
    nickname?: string;

    @IsOptional({ groups: [UserValidateGroup.CREATE, UserValidateGroup.UPDATE] })
    @IsUnique(
        { entity: UserEntity },
        {
            message: '该手机号已被注册',
            groups: [UserValidateGroup.CREATE],
        },
    )
    @IsMatchPhone(
        undefined,
        { strictMode: true },
        {
            message: '手机格式错误,示例: +86.15005255555',
            always: true,
        },
    )
    phone: string;

    /**
     * 邮箱地址: 必须符合邮箱地址规则
     * */
    @IsOptional({ groups: [UserValidateGroup.CREATE, UserValidateGroup.UPDATE] })
    @IsEmail(undefined, {
        always: true,
        message: '邮箱格式错误',
    })
    @IsUnique(
        { entity: UserEntity },
        {
            message: '该邮箱已被注册',
            groups: [UserValidateGroup.CREATE],
        },
    )
    email: string;

    /**
     * 用户密码:密码必须由小写字母,大写字母,数字以及特殊字符组成
     * */
    @IsOptional({ groups: [UserValidateGroup.UPDATE] })
    @Length(8, 50, {
        always: true,
        message: '密码长度不得少于$constraint1',
    })
    @IsPassword(5, {
        always: true,
        message: '密码必须由小写字母,大写字母,数字以及特殊字符组成',
    })
    password: string;

    /**
     * 确认密码:必须与用户密码输入相同的字符串
     * */
    @IsNotEmpty({ always: true, message: '请再次输入密码以确认' })
    @IsMatch('password', { always: true, message: '两次密码输入不一致' })
    plainPassword: string;
    // confirmPassword
}
