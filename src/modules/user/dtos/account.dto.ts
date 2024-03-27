import { PickType } from '@nestjs/swagger';

import { Length } from 'class-validator';

import { IsPassword } from '@/modules/core/constraints/password.constraint';
import { DtoValidation } from '@/modules/core/decorators';

import { UserValidateGroup } from '../constant';

import { UserCommonDto } from './common.dto';

/**
 * 更新用户信息
 * */
@DtoValidation({ groups: [UserValidateGroup.UPDATE] })
export class UpdateAccountDto extends PickType(UserCommonDto, ['username', 'nickname']) {}

/**
 * 更改用户密码
 * */
export class UpdatePasswordDto extends PickType(UserCommonDto, ['password', 'plainPassword']) {
    /**
     * 旧密码: 用户在更改密码的时候需要输入旧密码
     * */
    @Length(8, 50, {
        always: true,
        message: '密码长度不得少于$constraint1',
    })
    @IsPassword(5, {
        always: true,
        message: '密码必须由小写字母,大写字母,数字以及特殊字符组成',
    })
    oldPassword: string;
}
