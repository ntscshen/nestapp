import { toNumber } from 'lodash';

import { toBoolean } from 'validator';

import { Configure } from '../config/configure';

import { getRandomCharString } from './utils';

export const DTO_VALIDATION_OPTIONS = 'DTO_VALIDATION_OPTIONS';

/**
 * 默认应用配置
 * */
export const getDefaultAppConfig = (configure: Configure) => {
    const data = {
        name: getRandomCharString(9), // 生成一个随机应用名
        // host: configure.env.get<string>('APP_HOST', '127.0.0.1'), // 默认 127.0.0.1
        // host: configure.env.get<string>('APP_HOST', '124.223.78.185'), // 默认 127.0.0.1
        host: configure.env.get<string>('APP_HOST', '0.0.0.0'), // 默认 127.0.0.1
        port: configure.env.get<number>('APP_PORT', (v) => toNumber(v), 3000), // 默认 3000
        https: configure.env.get<boolean>('APP_SSL', (v) => toBoolean(v), false), // 默认 false
        timezone: configure.env.get<string>('APP_TIMEZONE', 'Asia/Shanghai'), // 默认 Asia/Shanghai
        locale: configure.env.get<string>('APP_LOCALE', 'zh-CN'), // 默认 zh-CN
        fallbackLocale: configure.env.get<string>('APP_FALLBACK_LOCALE', 'en'), // 备用语言 默认 en
    };
    return data;
};
// 这个 configure.env.get 是获取的Env类中的get，而不是Configure类中的get方法
