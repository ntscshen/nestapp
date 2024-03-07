import { ModuleMetadata, PipeTransform, Type } from '@nestjs/common';
import { NestFastifyApplication } from '@nestjs/platform-fastify';

import { CommandModule } from 'yargs';

import { CommandCollection } from '../core/types';

import { Configure } from './configure';

/**
 * 存储配置选项
 */
export interface ConfigStorageOption {
    /**
     * 是否开启存储
     */
    enabled?: boolean;
    /**
     * yaml文件路径,默认为dist目录外的config.yaml
     */
    filePath?: string;
}

/**
 * 配置注册器函数
 */
export type ConfigureRegister<T extends Record<string, any>> = (
    configure: Configure,
) => T | Promise<T>;

/**
 * 配置构造器
 */
export interface ConfigureFactory<
    T extends Record<string, any>,
    C extends Record<string, any> = T,
> {
    /**
     * 配置注册器
     */
    register: ConfigureRegister<RePartial<T>>;
    /**
     * 默认配置注册器
     */
    defaultRegister?: ConfigureRegister<T>;
    /**
     * 是否存储该配置
     */
    storage?: boolean;
    /**
     * 回调函数
     * @param configure 配置类服务实例
     * @param value 配置注册器register执行后的返回值
     */
    hook?: (configure: Configure, value: T) => C | Promise<C>;
    /**
     * 深度合并时是否对数组采用追加模式,默认 false
     */
    append?: boolean;
}

/**
 * 多连接连接型配置
 */
export type ConnectionOption<T extends Record<string, any>> = { name?: string } & T;
/**
 * 多连接连接型配置生成的结果
 */
export type ConnectionRst<T extends Record<string, any>> = Array<{ name: string } & T>;
/**
 * App对象类型
 */
export type App = {
    // 应用容器实例
    container?: NestFastifyApplication;
    // 配置类实例
    configure: Configure;
    // 命令列表
    commands: CommandModule<RecordAny, RecordAny>[];
};
/**
 * 创建应用的选项参数
 * 在这些参数中必须的参数有modules、builder，这个modules对应着标准应用根模块的imports，builder对应着NestFactor.create创建的部分
 * globals对应着原来根模块的providers，而config是自定义配置部分
 */
export interface CreateOptions {
    /**
     * 返回值为需要导入的模块
     */
    modules: (configure: Configure) => Promise<Required<ModuleMetadata['imports']>>;
    /**
     * 应用命令
     */
    commands: () => CommandCollection;
    /**
     * 应用构建器
     */
    builder: ContainerBuilder;
    /**
     * 全局配置
     */
    globals?: {
        /**
         * 全局管道,默认为AppPipe,设置为null则不添加
         * @param params
         */
        pipe?: (configure: Configure) => PipeTransform<any> | null;
        /**
         * 全局拦截器,默认为AppInterceptor,设置为null则不添加
         */
        interceptor?: Type<any> | null;
        /**
         * 全局过滤器,默认AppFilter,设置为null则不添加
         */
        filter?: Type<any> | null;
    };

    /**
     * 配置选项
     */
    config: {
        /**
         * 初始配置集
         */
        factories: Record<string, ConfigureFactory<Record<string, any>>>;
        /**
         * 配置服务的动态存储选项
         */
        storage: ConfigStorageOption;
    };
}

/**
 * 应用构建器
 */
export interface ContainerBuilder {
    (params: { configure: Configure; BootModule: Type<any> }): Promise<NestFastifyApplication>;
}
