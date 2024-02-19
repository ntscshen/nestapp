// 深度合并对象
import { Global, Module, ModuleMetadata, Type } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { NestFastifyApplication } from '@nestjs/platform-fastify';
import chalk from 'chalk';
import deepmerge from 'deepmerge';
import { isNil, omit } from 'lodash';

import { ConfigModule } from '../config/config.module';
import { Configure } from '../config/configure';
import { CreateOptions } from '../config/types';

import { Restful } from '../restful/restful';

import { APIDocOption } from '../restful/types';

import { CoreModule } from './core.module';
import { AppFilter, AppInterceptor, AppPipe } from './providers';
import { PanicOption } from './types';

/**
 * 用于请求验证中的boolean数据转义
 * @param value
 */
export function toBoolean(value?: string | boolean): boolean {
    if (isNil(value)) return false;
    if (typeof value === 'boolean') return value;
    try {
        return JSON.parse(value.toLowerCase());
    } catch (error) {
        return value as unknown as boolean;
    }
}
export const deepMerge = <T1, T2>(
    x: Partial<T1>,
    y: Partial<T2>,
    arrayMode: 'replace' | 'merge' = 'merge',
) => {
    const options: deepmerge.Options = {};
    if (arrayMode === 'replace') {
        options.arrayMerge = (_d, s, _o) => s;
        // 这意味着在合并过程中，当遇到数组类型的属性时，源数组将完全替换目标数组，而不是将它们合并。
    } else if (arrayMode === 'merge') {
        options.arrayMerge = (_d, s, _o) => Array.from(new Set([..._d, ...s]));
        // 使用了扩展运算符 (...) 将目标数组和源数组的元素合并到一个新数组中，
        // 然后通过 new Set() 创建一个集合，从而去除重复的元素。
        // Array.from 用于将 Set 对象转换回数组。
    }
    return deepmerge(x, y, options) as T2 extends T1 ? T1 : T1 & T2;
};

// destinationArray目的地, sourceArray源, options

// 判断一个函数是否为异步函数
export function isAsyncFn<R, A extends Array<any>>(
    callback: (...asgs: A) => Promise<R> | R,
): callback is (...asgs: A) => Promise<R> {
    const AsyncFunction = (async () => {}).constructor;
    return callback instanceof AsyncFunction === true;
}

type MetadataFunction = () => ModuleMetadata;
function defaultMetadataFunction(): ModuleMetadata {
    return {};
}

// src/modules/core/helpers/app.ts
export async function createBootModule(
    configure: Configure,
    options: Pick<CreateOptions, 'globals' | 'modules'>,
): Promise<Type<any>> {
    const { globals = {} } = options;
    // 获取需要导入的模块
    // console.log('configure :>> ', configure);

    /** 就是create中的modules属性，执行之后的返回值就是两个动态模块
    modules: async (configure) => [
      ContentModule.forRoot(configure),
      DatabaseModule.forRoot(configure),
    ],
     * */
    const modules = await options.modules(configure);

    const imports: ModuleMetadata['imports'] = (
        await Promise.all([
            ...modules,
            ConfigModule.forRoot(configure),
            await CoreModule.forRoot(configure),
        ])
    ).map((item) => {
        if ('module' in item) {
            const meta = omit(item, ['module', 'global']);
            Module(meta)(item.module);
            if (item.global) Global()(item.module);
            return item.module;
        }
        return item;
    });
    // 配置全局提供者
    const providers: ModuleMetadata['providers'] = [];
    if (globals.pipe !== null) {
        const pipe = globals.pipe
            ? globals.pipe(configure)
            : new AppPipe({
                  transform: true,
                  whitelist: true,
                  forbidNonWhitelisted: true,
                  forbidUnknownValues: true,
                  validationError: { target: false },
              });
        providers.push({
            provide: APP_PIPE,
            useValue: pipe,
        });
    }
    if (globals.interceptor !== null) {
        providers.push({
            provide: APP_INTERCEPTOR,
            useClass: globals.interceptor ?? AppInterceptor,
        });
    }
    if (globals.filter !== null) {
        providers.push({
            provide: APP_FILTER,
            useClass: AppFilter,
        });
    }

    return CreateModule('BootModule', () => {
        const meta: ModuleMetadata = {
            imports,
            providers,
        };
        return meta;
    });
}
// 创建一个动态模块
export function CreateModule(
    target: string | Type<any>,
    // metaSetter: () => ModuleMetadata = () => ({}),
    metaSetter: MetadataFunction = defaultMetadataFunction,
): Type<any> {
    let ModuleClass: Type<any>;
    if (typeof target === 'string') {
        ModuleClass = class {};
        Object.defineProperty(ModuleClass, 'name', {
            value: target,
        });
    } else {
        ModuleClass = target;
    }
    Module(metaSetter())(ModuleClass);
    return ModuleClass;
}

/**
 * 输出命令行错误消息
 * @param option
 */
export async function panic(option: PanicOption | string) {
    console.log('输出命令行错误消息');
    if (typeof option === 'string') {
        console.log(chalk.red(`\n❌ ${option}`));
        process.exit(1);
    }
    const { error, message, exit = true } = option;
    !isNil(error) ? console.log(chalk.red(error)) : console.log(chalk.red(`\n❌ ${message}`));
    if (exit) process.exit(1);
}
/**
 * 生成一个指定长度的随机字符串
 * (使用了英文字母（大写和小写）作为字符来源)
 * @param length 长度
 * */
export const getRandomCharString = (length: number) => {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
};
/**
 * 输出API和DOC地址
 * @param factory
 */
export async function echoApi(configure: Configure, container: NestFastifyApplication) {
    const appUrl = await configure.get<string>('app.url');
    // 设置应用的API前缀,如果没有则与appUrl相同
    const urlPrefix = await configure.get('app.prefix', undefined);
    const apiUrl = !isNil(urlPrefix)
        ? `${appUrl}${urlPrefix.length > 0 ? `/${urlPrefix}` : urlPrefix}`
        : appUrl;
    console.log(`- RestAPI: ${chalk.green.underline(apiUrl)}`);
    console.log('- RestDocs:');
    const factory = container.get(Restful);
    const { default: defaultDoc, ...docs } = factory.docs;
    await echoApiDocs('default', defaultDoc, appUrl);
    for (const [name, doc] of Object.entries(docs)) {
        console.log();
        echoApiDocs(name, doc, appUrl);
    }
}

/**
 * 输出一个版本的API和DOC地址
 * @param name
 * @param doc
 * @param appUrl
 */
async function echoApiDocs(name: string, doc: APIDocOption, appUrl: string) {
    const getDocPath = (dpath: string) => `${appUrl}/${dpath}`;
    if (!doc.routes && doc.default) {
        console.log(
            `    [${chalk.blue(name.toUpperCase())}]: ${chalk.green.underline(
                getDocPath(doc.default.path),
            )}`,
        );
        return;
    }
    console.log(`    [${chalk.blue(name.toUpperCase())}]:`);
    if (doc.default) {
        console.log(`      default: ${chalk.green.underline(getDocPath(doc.default.path))}`);
    }
    if (doc.routes) {
        Object.entries(doc.routes).forEach(([_routeName, rdocs]) => {
            console.log(
                `      <${chalk.yellowBright.bold(rdocs.title)}>: ${chalk.green.underline(
                    getDocPath(rdocs.path),
                )}`,
            );
        });
    }
}
