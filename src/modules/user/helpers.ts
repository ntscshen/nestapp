import bcrypt from 'bcrypt';
import { get, isNil, toNumber } from 'lodash';

import { Configure } from '../config/configure';

import { ConfigureFactory, ConfigureRegister } from '../config/types';

import { UserConfig } from './types';

export const defaultUserConfig = (configure: Configure): UserConfig => {
    return {
        hash: 10,
        jwt: {
            secret: configure.env.get<string>('USER.TOKEN.SECRET', 'my-refresh-secret'),
            token_expired: configure.env.get<number>(
                'USER_TOKEN_EXPIRED',
                (v) => toNumber(v),
                3600,
            ),
            refresh_secret: configure.env.get<string>('USER_REFRESH_SECRET', 'my-refresh-secret'),
            refresh_token_expired: configure.env.get<number>(
                'USER_REFRESH_TOKEN_EXPIRED',
                (v) => toNumber(v),
                3600 * 30,
            ),
        },
    };
};

export const createUserConfig: (
    register: ConfigureRegister<RePartial<UserConfig>>,
) => ConfigureFactory<UserConfig> = (register) => ({
    register,
    defaultRegister: defaultUserConfig,
});

export async function getUserConfig<T>(configure: Configure, key?: string): Promise<T> {
    const userConfig = await configure.get<UserConfig>('user', defaultUserConfig(configure));
    if (isNil(key)) return userConfig as T;
    return get(userConfig, key) as T;
}

// 加密
export const encrypt2 = async (configure: Configure, password: string) => {
    const hash = (await getUserConfig<number>(configure, 'hash')) || 10;
    try {
        return await Bun.password.hash(password, {
            algorithm: 'bcrypt',
            cost: hash,
        });
    } catch (error) {
        return bcrypt.hashSync(password, hash);
    }
};

// 解密
export const decrypt2 = (password: string, hash: string) => {
    try {
        return Bun.password.verifySync(password, hash);
    } catch (error) {
        return bcrypt.compareSync(password, hash);
    }
};

/**
 * 加密明文密码
 * @param configure
 * @param password
 */
export const encrypt = async (configure: Configure, password: string) => {
    const hash = (await getUserConfig<number>(configure, 'hash')) || 10;
    return bcrypt.hashSync(password, hash);
};

/**
 * 验证密码
 * @param password 用户提供的明文密码。
 * @param hashed 存储在数据库中的哈希过的密码。(是旧密码的哈希值，而不是明文的旧密码)
 */
export const decrypt = (password: string, hashed: string) => {
    return bcrypt.compareSync(password, hashed);
};
