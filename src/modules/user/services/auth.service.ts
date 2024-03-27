import { ForbiddenException, Injectable } from '@nestjs/common';

import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { ExtractJwt } from 'passport-jwt';

import { Configure } from '@/modules/config/configure';

import { getTime } from '@/modules/core/helpers/time';

import { UpdatePasswordDto } from '../dtos/account.dto';
import { RegisterDto } from '../dtos/auth.dto';
import { UserEntity } from '../entities/user.entity';
import { decrypt, defaultUserConfig } from '../helpers';
import { UserRepository } from '../repositories/user.repository';

import { UserConfig } from '../types';

import { TokenService } from './token.service';
import { UserService } from './user.service';

@Injectable()
export class AuthService {
    constructor(
        protected configure: Configure,
        protected userService: UserService,
        protected tokenService: TokenService,
        protected userRepository: UserRepository,
    ) {}

    async login(user: UserEntity) {
        const now = await getTime(this.configure);
        const { accessToken } = await this.tokenService.generateAccessToken(user, now);
        return accessToken.value;
    }

    async logout(req: Request) {
        const accessToken = ExtractJwt.fromAuthHeaderAsBearerToken()(req as any);
        if (accessToken) {
            await this.tokenService.removeAccessToken(accessToken);
        }
        return {
            msg: 'logout_success',
        };
    }

    async validateUser(credential: string, password: string) {
        const user = await this.userService.findOneByCredential(credential, async (query) => {
            return query.addSelect('user.password');
        });
        if (user && decrypt(password, user.password)) {
            return user;
        }
        return false;
    }

    /**
     * 根据用户ID生成token
     * @param id 用户的唯一标识符（ID）。这通常是数据库中用户记录的主键。
     *
     * 为指定用户ID生成一个访问令牌（Access Token）
     * 通常在用户登录成功后被调用，以便为用户创建一个新的会话令牌
     * */
    async createToken(id: string) {
        const now = await getTime(this.configure);
        let user: UserEntity;
        try {
            user = await this.userService.detail(id);
        } catch (error) {
            throw new ForbiddenException();
        }
        const { accessToken } = await this.tokenService.generateAccessToken(user, now);
        return accessToken.value;
    }

    /**
     * 处理用户注册流程
     * @param data 类型为RegisterDto的对象，包含了用户注册时提供的数据，至少包括用户名、昵称和密码。
     * */
    async register(data: RegisterDto) {
        const { username, nickname, password } = data;
        const user = await this.userService.create({
            username,
            nickname,
            password,
            actived: true,
        } as any);
        return this.userService.findOneByCondition({ id: user.id });
    }

    /**
     * 更新用户密码
     * @param user 用户实体(UserEntity)，代表要更新密码的用户
     * @param xx password是用户想要设置的新密码，oldPassword是用户当前的旧密码。
     * */
    async updatePassword(user: UserEntity, { password, oldPassword }: UpdatePasswordDto) {
        const item = await this.userRepository.findOneOrFail({
            select: ['password'],
            where: { id: user.id },
        });
        if (decrypt(item.password, oldPassword)) {
            throw new ForbiddenException('old password not matched');
        }
        item.password = password;
        await this.userRepository.save(item);
        return this.userService.findOneByCondition({ id: item.id });
    }

    static jwtModuleFactory(configure: Configure) {
        return JwtModule.registerAsync({
            useFactory: async (): Promise<JwtModuleOptions> => {
                const config = await configure.get<UserConfig>(
                    'user',
                    defaultUserConfig(configure),
                );
                const option: JwtModuleOptions = {
                    secret: config.jwt.secret,
                    verifyOptions: {
                        ignoreExpiration: !configure.env.isProd(),
                    },
                };
                if (configure.env.isProd())
                    option.signOptions.expiresIn = `${config.jwt.token_expired}s`;
                return option;
            },
        });
    }
}
