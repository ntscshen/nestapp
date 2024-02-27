import { Type } from '@nestjs/common';
import { RouteTree, Routes } from '@nestjs/core';
import { ApiTags } from '@nestjs/swagger';
import { camelCase, isNil, omit, trim, upperFirst } from 'lodash';

import { Configure } from '../config/configure';

import { CreateModule } from '../core/utils';

import { CONTROLLER_DEPENDS } from './constants';
import { RouteOption } from './types';

/**
 * 路由前缀处理
 * */
export const trimPath = (routePath: string, addPrefix = true) =>
    `${addPrefix ? '/' : ''}${trim(routePath.replace('//', '/'), '/')}`;

/**
 * 遍历路由及其子孙路由以清理路径前缀
 * 递归地清理一个路由配置数组中的所有路由路径，并对有子路由的配置进行递归处理。
 * */
export const getCleanRoutes = (data: RouteOption[]): RouteOption[] => {
    return data.map((option) => {
        const route: RouteOption = {
            ...omit(option, 'children'),
            path: trimPath(option.path),
        };
        if (option.children && option.children.length > 0) {
            route.children = getCleanRoutes(option.children);
        } else {
            delete route.children;
        }
        return route;
    });
};
/**
 * 生成最终文档路径
 * @param routePath
 * @param prefix
 * @param version
 */
export const genDocPath = (routePath: string, prefix?: string, version?: string) =>
    trimPath(`${prefix}${version ? `/${version.toLowerCase()}/` : '/'}${routePath}`, false);

// src/modules/restful/helpers.ts

// routes = {
//     title: '3R_ntscshen',
//     description: '3R_ntscshen_TS全栈开发',
//     auth: true,
//     routes: [
//       {
//         name: 'app',
//         path: '/',
//         controllers: [],
//         doc: [Object],
//         children: [Array]
//       }
//     ],
//     tags: []
//   }
/**
 * 动态构建应用中的路由模块树。它通过递归处理每个路由配置项（包括子路由），
 * 为每个路由创建相应的 NestJS 模块，并最终返回一个包含所有路由模块信息的 Promise。
 * @param configure 配置服务
 * @param modules 已创建的模块集合
 * @param routes 已经创建的路由
 * @param parentModule 父模块的名称
 */
export const createRouteModuleTree = (
    configure: Configure,
    modules: { [key: string]: Type<any> },
    routes: RouteOption[],
    parentModule?: string,
): Promise<Routes> => {
    return Promise.all(
        routes.map(async ({ name, path, children, controllers, doc }) => {
            // 自动创建路由模块的名称
            const moduleName = parentModule ? `${parentModule}.${name}` : name;
            // RouteModule的名称必须唯一
            if (Object.keys(modules).includes(moduleName)) {
                throw new Error('route name should be unique in same level!');
            }
            // 获取每个控制器的依赖模块
            const depends = controllers
                .map((c) => Reflect.getMetadata(CONTROLLER_DEPENDS, c) || [])
                .reduce((o: Type<any>[], n) => [...o, ...n], [])
                .reduce((o: Type<any>[], n: Type<any>) => {
                    if (o.find((i) => i === n)) return o;
                    return [...o, n];
                }, []);
            // 为每个没有自己添加`ApiTags`装饰器的控制器添加Tag
            if (doc?.tags && doc.tags.length > 0) {
                controllers.forEach((controller) => {
                    if (!Reflect.getMetadata('swagger/apiUseTags', controller)) {
                        ApiTags(
                            ...doc.tags.map((tag) => (typeof tag === 'string' ? tag : tag.name))!,
                        )(controller);
                    }
                });
            }
            // 创建路由模块,并导入所有控制器的依赖模块
            const module = CreateModule(`${upperFirst(camelCase(name))}RouteModule`, () => ({
                controllers,
                imports: depends,
            }));
            // 在modules变量中追加创建的RouteModule,防止重名
            modules[moduleName] = module;
            const route: RouteTree = { path, module };
            // 如果有子路由则进一步处理
            if (children)
                route.children = await createRouteModuleTree(
                    configure,
                    modules,
                    children,
                    moduleName,
                );
            return route;
        }),
    );
};

/**
 * 生成最终路由路径(为路由路径添加自定义及版本前缀)
 * @param routePath
 * @param prefix
 * @param version
 */
export const genRoutePath = (routePath: string, prefix?: string, version?: string) => {
    const addVersion = `${version ? `/${version.toLowerCase()}/` : '/'}${routePath}`;
    return isNil(prefix) ? trimPath(addVersion) : trimPath(`${prefix}${addVersion}`);
};
