import { Type } from '@nestjs/common';
import { Routes } from '@nestjs/core';

import { pick } from 'lodash';

import { Configure } from '../config/configure';

import { createRouteModuleTree, genRoutePath, getCleanRoutes } from './helpers';
import { ApiConfig, RouteOption } from './types';

// BaseRestful类作为一个抽象基类，提供了构建RESTful API服务的基础框架。
// 它通过依赖注入一个配置管理器（Configure实例）来访问应用配置，并要求任何继承自该类的子类实现create方法，
// 以便根据具体的API配置来设置或初始化API服务。这种设计模式促进了代码的模块化和重用，
// 使得开发不同API服务时能够共享通用的配置和初始化逻辑，同时保持了灵活性，允许针对特定API服务进行定制化配置。
export abstract class BaseRestful {
    constructor(protected configure: Configure) {}
    abstract create(_config: ApiConfig): void;

    // API配置
    protected config!: ApiConfig;

    // 路由表
    protected _routes: Routes = [];

    // 默认API版本号
    protected _default!: string;

    // 启用的API版本
    protected _versions: string[] = [];

    // 自动创建的RouteModule
    protected _modules: { [key: string]: Type<any> } = {};

    get routes(): Routes {
        return this._routes;
    }

    get default(): string {
        return this._default;
    }

    get versions(): string[] {
        return this._versions;
    }

    get modules(): { [key: string]: Type<any> } {
        return this._modules;
    }

    // 创建配置 config: {
    //     title: '3R_ntscshen',
    //     description: '3R_ntscshen_TS全栈开发',
    //     auth: true,
    //     docuri: 'api/docs',
    //     default: 'v1',
    //     enabled: [ 'v1', 'v2' ],
    //     versions: { v1: { routes: [Array] }, v2: { routes: [Array] } }
    //   }
    /**
     * 创建配置
     * @param config
     */
    protected createConfig(config: ApiConfig) {
        // console.log('🚀 ~ BaseRestful ~ createConfig ~ 创建配置 config:', config);
        if (!config.default) {
            throw new Error('default api version name should been config!');
        }
        // console.log('Object.entries(config.versions) :>> ', Object.entries(config.versions));
        // [ [ 'v1', { routes: [Array] } ], [ 'v2', { routes: [Array] } ] ]
        const versionMaps = Object.entries(config.versions)
            // 过滤启用的版本：从配置的所有版本中过滤出应该被启用(激活 enabled)的版本，其中default是必须包含的。
            .filter(([name]) => {
                if (config.default === name) return true;
                return config.enabled.includes(name);
            })
            // 合并版本配置与总配置：将全局配置与每个版本的特定配置进行合并。同时对版本中的路由进行清理和标准化处理。
            .map(([name, version]) => [
                name,
                {
                    ...pick(config, ['title', 'description', 'auth']),
                    ...version, // 展开操作符，如果特定版本配置与全局配置重叠，版本特定配置优先
                    // 合并全局配置和特定版本配置中的 tags。 config.tags是全局共享标签
                    tags: Array.from(new Set([...(config.tags ?? []), ...(version.tags ?? [])])),
                    routes: getCleanRoutes(version.routes ?? []), // 清理和标准化处理
                },
            ]);
        // 每个版本在经过这一步骤处理后，将得到一个完整的配置对象
        // 这个对象既包含了从全局配置继承的属性，也包含了该版本特有的设置（如特定的 tags 和经过清理的 routes）。

        // 1. 只包含那些被启用的版本，并且每个版本的配置都已经包含了必要的合并和处理。
        config.versions = Object.fromEntries(versionMaps);
        // 2. 设置所有版本号。提取 config.versions 对象的键（即版本名称），将所有被启用（并且已经处理过的）版本的名称存储到类的 _versions 属性中
        this._versions = Object.keys(config.versions);
        // 3. 设置默认版本号。默认版本对于处理未明确指定版本的 API 请求非常重要，它定义了这种情况下应该使用哪个版本的 API。
        this._default = config.default;
        // 4. 启用的版本中必须包含默认版本。确保了配置的默认版本实际上是存在并被启用的。
        //    如果默认版本没有被包括在启用的版本中，这通常表示配置有误，因此抛出错误，提示开发者需要修正配置。
        if (!this._versions.includes(this._default)) {
            throw new Error(`Default api version named ${this._default} not exists!`);
        }
        this.config = config;
    }

    /**
     * 创建路由树及路由模块
     * 核心目的: 动态创建路由树和相应的路由模块，这一过程是基于配置中定义的不同API版本进行的。
     * 主要功能：根据配置（包括不同的API版本和每个版本下的路由配置）来创建一组符合动态路由规范的数据结构。
     *          并最终将这组数据结构赋值给 this._routes。以便为后续的路由注册和模块导入提供基础。
     *           1. 包括每个路由的路径 (path)
     *           2. 对应的 NestJS 模块 (module)
     *           3. 以及可能存在的子路由 (children)
     * @returns undefined
     */
    protected async createRoutes() {
        const prefix = await this.configure.get<string>('app.prefix');
        const versionMaps = Object.entries(this.config.versions);

        // 对每个版本的路由使用'resolveRoutes'方法进行处理
        this._routes =
            // 使用 Promise.all 允许程序同时处理所有版本的路由创建，而不是按顺序一个接一个地处理，从而显著提高了处理效率。
            (
                await Promise.all(
                    versionMaps.map(async ([name, version]) => {
                        const xxxxx = (
                            await createRouteModuleTree(
                                this.configure,
                                this._modules,
                                version.routes ?? [],
                                // 这里的version就是v1,v2
                                // routes就是v1.ts,v2.ts中的 routes
                                name,
                            )
                        ).map((route) => ({
                            ...route,
                            path: genRoutePath(route.path, prefix, name),
                        }));
                        return xxxxx;
                    }),
                )
            ).reduce((o, n) => [...o, ...n], []);
        // 生成一个默认省略版本号的路由
        // 我什么设计了一个省略版本号的路由?
        //      1. 省略版本号的路由设计是为了提供便捷访问和用户无感知的体验，同时给予API维护者调整默认版本的灵活性。
        //      2. 这种设计允许用户在不指定具体版本的情况下，自动访问到被认为是最稳定或最适合当前用户需求的API版本

        const defaultVersion = this.config.versions[this._default];
        this._routes = [
            ...this._routes,
            ...(
                await createRouteModuleTree(
                    this.configure,
                    this._modules,
                    defaultVersion.routes ?? [],
                )
            ).map((route) => ({
                ...route,
                path: genRoutePath(route.path, prefix),
            })),
        ];
    }

    /**
     * 获取一个路由列表下的所有路由模块(路由模块是手动创建的动态模块)
     * @param routes
     * @param parent
     */
    protected getRouteModules(routes: RouteOption[], parent?: string) {
        const result = routes
            .map(({ name, children }) => {
                const routeName = parent ? `${parent}.${name}` : name;
                let modules: Type<any>[] = [this._modules[routeName]];
                if (children) modules = [...modules, ...this.getRouteModules(children, routeName)];
                return modules;
            })
            .reduce((o, n) => [...o, ...n], [])
            .filter((i) => !!i);
        return result;
    }
}
