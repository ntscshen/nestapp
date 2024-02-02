import { BadGatewayException } from '@nestjs/common';
import { useContainer } from 'class-validator';
import { isNil } from 'lodash';

import { Configure } from '../config/configure';
import { App, ConfigureFactory, ConfigureRegister, CreateOptions } from '../config/types';

import { getDefaultAppConfig } from './constants';

import { AppConfig } from './types';
import { createBootModule } from './utils';

// app实例常量
export const app: App = { configure: new Configure() };

/**
 * 创建一个应用
 * @param options 创建选项
 */
export const createApp = (options: CreateOptions) => async (): Promise<App> => {
    const { config, builder } = options;
    // 初始化配置实例
    await app.configure.initilize(config.factories, config.storage);
    // 如果没有app配置则使用默认配置
    if (!app.configure.has('app')) {
        throw new BadGatewayException('App config not exists!');
    }
    // console.log('1111 :>> ', app.configure.all());
    // 创建启动模块
    const BootModule = await createBootModule(app.configure, options);
    // 创建app的容器实例
    app.container = await builder({
        configure: app.configure,
        BootModule,
    });
    // 设置api前缀
    // if (app.configure.has('app.prefix')) {
    //     app.container.setGlobalPrefix(await app.configure.get<string>('app.prefix'));
    // }
    // 为class-validator添加容器以便在自定义约束中可以注入dataSource等依赖
    useContainer(app.container.select(BootModule), {
        fallbackOnErrors: true,
    });
    return app;
};

/**
 * 应用配置工厂
 */
export const createAppConfig: (
    register: ConfigureRegister<RePartial<AppConfig>>,
) => ConfigureFactory<AppConfig> = (register) => ({
    register,
    defaultRegister: (configure) => getDefaultAppConfig(configure),
    hook: (configure: Configure, value) => {
        if (isNil(value.url))
            value.url = `${value.https ? 'https' : 'http'}://${value.host}:${value.port}`;
        return value;
    },
});

/**
 * 构建APP CLI，默认 start 命令应用启动监听 app
 * @param creator APP 构建器 （名词，创造者）
 * @param listened 监听回调
 * */
export async function startApp(
    creator: () => Promise<App>,
    listened: (app: App) => () => Promise<void>,
) {
    const { container, configure } = await creator();
    const { port, host } = await configure.get<AppConfig>('app');

    await container.listen(port, host, listened(app));
}
