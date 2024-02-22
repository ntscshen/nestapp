import { Type } from '@nestjs/common';
import { Routes } from '@nestjs/core';

import { isNil, pick } from 'lodash';

import { Configure } from '../config/configure';

import { createRouteModuleTree, getCleanRoutes, trimPath } from './helpers';
import { ApiConfig, RouteOption } from './types';
/**
 * 生成最终路由路径(为路由路径添加自定义及版本前缀)
 * @param routePath
 * @param version
 */
export const genRoutePath = (routePath: string, prefix?: string, version?: string) => {
    const addVersion = `${version ? `/${version.toLowerCase()}/` : '/'}${routePath}`;
    return isNil(prefix) ? trimPath(addVersion) : trimPath(`${prefix}${addVersion}`);
};

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

    /**
     * 创建配置
     * @param config
     */
    protected createConfig(config: ApiConfig) {
        console.log('🚀 ~ BaseRestful ~ createConfig ~ 创建配置 config:', config);
        // 🚀 ~ BaseRestful ~ createConfig ~ config: {
        //     title: '3R_ntscshen',
        //     description: '3R_ntscshen_TS全栈开发',
        //     auth: true,
        //     docuri: 'api/docs',
        //     default: 'v1',
        //     enabled: [],
        //     versions: { v1: { routes: [Array] } }
        //   }
        if (!config.default) {
            throw new Error('default api version name should been config!');
        }
        const versionMaps = Object.entries(config.versions)
            // 过滤启用的版本
            .filter(([name]) => {
                if (config.default === name) return true;
                return config.enabled.includes(name);
            })
            // 合并版本配置与总配置
            .map(([name, version]) => [
                name,
                {
                    ...pick(config, ['title', 'description', 'auth']),
                    ...version,
                    tags: Array.from(new Set([...(config.tags ?? []), ...(version.tags ?? [])])),
                    routes: getCleanRoutes(version.routes ?? []),
                },
            ]);

        config.versions = Object.fromEntries(versionMaps);
        // 设置所有版本号
        this._versions = Object.keys(config.versions);
        // 设置默认版本号
        this._default = config.default;
        // 启用的版本中必须包含默认版本
        if (!this._versions.includes(this._default)) {
            throw new Error(`Default api version named ${this._default} not exists!`);
        }
        this.config = config;
    }

    protected async createRoutes() {
        const prefix = await this.configure.get<string>('app.prefix');
        const versionMaps = Object.entries(this.config.versions);

        // 对每个版本的路由使用'resolveRoutes'方法进行处理
        this._routes = (
            await Promise.all(
                versionMaps.map(async ([name, version]) =>
                    (
                        await createRouteModuleTree(
                            this.configure,
                            this._modules,
                            version.routes ?? [],
                            name,
                        )
                    ).map((route) => ({
                        ...route,
                        path: genRoutePath(route.path, prefix, name),
                    })),
                ),
            )
        ).reduce((o, n) => [...o, ...n], []);
        // 生成一个默认省略版本号的路由
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
