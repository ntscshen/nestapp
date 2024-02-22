import { INestApplication, Type } from '@nestjs/common';
import { RouterModule } from '@nestjs/core';

import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { isNil, omit, trim } from 'lodash';

import { BaseRestful } from './base';
import { genDocPath } from './helpers';
import {
    APIDocOption,
    ApiConfig,
    ApiDocSource,
    RouteOption,
    SwaggerOption,
    VersionOption,
} from './types';

export class Restful extends BaseRestful {
    protected _docs!: {
        [version: string]: APIDocOption;
    };

    /**
     * 排除已经添加的模块
     */
    protected excludeVersionModules: string[] = [];

    get docs() {
        return this._docs;
    }

    async create(config: ApiConfig) {
        this.createConfig(config);
        await this.createRoutes();
        this.createDocs(); // 将动态创建Swagger的相关信息存储到this._docs中
    }

    getModuleImports() {
        const moduleImports = [...Object.values(this.modules), RouterModule.register(this.routes)];
        console.log('🚀 ~ Restful ~ getModuleImports ~ moduleImports 动态路由注册:', moduleImports);
        return moduleImports;
    }

    /**
     * 创建文档配置
     */
    protected createDocs() {
        const versionMaps = Object.entries(this.config.versions);
        const vDocs = versionMaps.map(([name, version]) => [
            name,
            this.getDocOption(name, version),
        ]);
        this._docs = Object.fromEntries(vDocs);
        const defaultVersion = this.config.versions[this._default];
        // 为默认版本再次生成一个文档
        this._docs.default = this.getDocOption(this._default, defaultVersion, true);
    }

    /**
     * 生成路由文档
     * @param option
     * @param routes
     * @param parent
     * 目标是为每个路由（包括子路由）生成 Swagger 文档的配置，
     * 通过递归处理来确保即使是嵌套路由也能被正确处理并包含在最终的 Swagger 文档中。
     * 这个过程涉及合并基础的 Swagger 选项与路由特有的文档信息，以及处理子路由的递归逻辑。
     *
     * 返回的数据结构是非嵌套的。即使是处理嵌套路由，
     * 该方法也会将所有路由（无论是父路由还是子路由）的文档配置平铺在同一个对象中，而不是以嵌套结构表示。
     *
     * {
     *   "parent": { 父路由的 Swagger 配置 },
     *   "parent.child": { 子路由的 Swagger 配 }
     * }
     */
    protected getRouteDocs(
        option: Omit<SwaggerOption, 'include'>,
        routes: RouteOption[],
        parent?: string,
    ): { [key: string]: SwaggerOption } {
        /**
         * 合并Doc配置
         *
         * @param {Omit<SwaggerOption, 'include'>} vDoc
         * @param {RouteOption} route
         */
        const mergeDoc = (vDoc: Omit<SwaggerOption, 'include'>, route: RouteOption) => {
            return {
                ...vDoc,
                ...route.doc,
                tags: Array.from(new Set([...(vDoc.tags ?? []), ...(route.doc?.tags ?? [])])),
                path: genDocPath(route.path, this.config.docuri, parent),
                include: this.getRouteModules([route], parent),
            };
        };
        let routeDocs: { [key: string]: SwaggerOption } = {};

        // 判断路由是否有除tags之外的其它doc属性
        const hasAdditional = (doc?: ApiDocSource) =>
            doc && Object.keys(omit(doc, 'tags')).length > 0;

        for (const route of routes) {
            const { name, doc, children } = route;
            const moduleName = parent ? `${parent}.${name}` : name;

            // 加入在版本DOC中排除模块列表
            if (hasAdditional(doc) || parent) this.excludeVersionModules.push(moduleName);

            // 添加到routeDocs中
            if (hasAdditional(doc)) {
                routeDocs[moduleName.replace(`${option.version}.`, '')] = mergeDoc(option, route);
            }
            if (children) {
                routeDocs = {
                    ...routeDocs,
                    ...this.getRouteDocs(option, children, moduleName),
                };
            }
        }
        return routeDocs;
    }

    /**
     * 生成版本文档配置
     * @param name key值
     * @param voption v1版本中的routes值
     * @param isDefault
     */
    protected getDocOption(name: string, voption: VersionOption, isDefault = false) {
        const docConfig: APIDocOption = {};
        // 默认文档配置
        const defaultDoc = {
            title: voption.title!,
            description: voption.description!,
            tags: voption.tags ?? [],
            auth: voption.auth ?? false,
            version: name,
            path: trim(`${this.config.docuri}${isDefault ? '' : `/${name}`}`, '/'),
        } as any;
        // 获取路由文档
        const routesDoc = isDefault
            ? this.getRouteDocs(defaultDoc, voption.routes ?? [])
            : this.getRouteDocs(defaultDoc, voption.routes ?? [], name);
        if (Object.keys(routesDoc).length > 0) {
            docConfig.routes = routesDoc;
        }
        const routeModules = isDefault
            ? this.getRouteModules(voption.routes ?? [])
            : this.getRouteModules(voption.routes ?? [], name);
        // 文档所依赖的模块
        const include = this.filterExcludeModules(routeModules);
        // 版本DOC中有依赖的路由模块或者版本DOC中没有路由DOC则添加版本默认DOC
        if (include.length > 0 || !docConfig.routes) {
            docConfig.default = { ...defaultDoc, include };
        }
        return docConfig;
    }

    /**
     * 排除已经添加的模块
     * exclude 排除
     * @param routeModules
     * 核心目的：
     *   是从一组模块中过滤掉那些不属于当前路由配置下的模块，
     *   确保只有与当前路由（及其子路由）相关联的模块被保留。
     *   这样做的目的是为了在处理如动态生成 Swagger 文档或其他基于模块的操作时，
     *   能够精确控制哪些模块应该被包含在当前的操作或文档生成过程中。
     */
    protected filterExcludeModules(routeModules: Type<any>[]) {
        const excludeModules: Type<any>[] = [];
        const excludeNames = Array.from(new Set(this.excludeVersionModules));
        for (const [name, module] of Object.entries(this._modules)) {
            if (excludeNames.includes(name)) excludeModules.push(module);
        }
        return routeModules.filter(
            (rmodule) => !excludeModules.find((emodule) => emodule === rmodule),
        );
    }

    /**
     * 构建Open API
     * @param container
     */
    async factoryDocs<T extends INestApplication>(
        container: T,
        metadata?: () => Promise<Record<string, any>>,
    ) {
        const docs = Object.values(this._docs)
            .map((vdoc) => [vdoc.default, ...Object.values(vdoc.routes ?? {})])
            .reduce((o, n) => [...o, ...n], [])
            .filter((i) => !!i);
        for (const voption of docs) {
            const { title, description, version, auth, include, tags } = voption!;
            const builder = new DocumentBuilder();
            if (title) builder.setTitle(title);
            if (description) builder.setDescription(description);
            if (auth) builder.addBearerAuth();
            if (tags) {
                tags.forEach((tag) =>
                    typeof tag === 'string'
                        ? builder.addTag(tag)
                        : builder.addTag(tag.name, tag.description, tag.externalDocs),
                );
            }
            builder.setVersion(version);
            console.log('isNil(metadata) :>> ', isNil(metadata));
            if (!isNil(metadata)) await SwaggerModule.loadPluginMetadata(metadata);
            const document = SwaggerModule.createDocument(container, builder.build(), {
                include: include.length > 0 ? include : [() => undefined as any],
                // 忽略全局路由前缀
                ignoreGlobalPrefix: true,
                // 嵌套路由模块扫码(可选)
                deepScanRoutes: true,
            });
            SwaggerModule.setup(voption!.path, container, document);
        }
    }
}
