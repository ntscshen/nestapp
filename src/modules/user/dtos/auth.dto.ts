import { PickType } from '@nestjs/swagger';

import { UserCommonDto } from './common.dto';

/**
 * 用户正常方式登录
 * credential(名词): 登录凭证（/krəˈdenʃl/）
 * plain() 明文 /pleɪn/
 * */
export class CredentialDto extends PickType(UserCommonDto, ['credential', 'password']) {}

/**
 * 普通方式注册用户
 * */
export class RegisterDto extends PickType(UserCommonDto, [
    'username',
    'nickname',
    'password',
    'plainPassword',
]) {}
