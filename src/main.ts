import { isNil } from 'lodash';

import { createData } from './constants';
import { createApp, startApp } from './modules/core/app';

// async function bootstrap() {
//     // 使用 fastify 驱动
//     const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter(), {
//         // 启动跨域访问
//         cors: true,
//         // 只使用 error 和 warn 两种输出，避免在控制台冗余输出
//         // logger: ['error', 'warn'],
//     });
//     // 设置全局访问前缀
//     app.setGlobalPrefix('api');
//     useContainer(app.select(AppModule), { fallbackOnErrors: true });
//     // 允许跨越
//     await app.listen(3000, '0.0.0.0');
//     console.log('api >> : http://localhost:3000');
// }
// bootstrap();

startApp(createApp(createData), ({ configure }) => async () => {
    console.log();
    const chalk = (await import('chalk')).default;
    const appUrl = await configure.get<string>('app.url');
    // 设置应用的API前缀,如果没有则与appUrl相同
    const urlPrefix = await configure.get('app.prefix', undefined);

    console.log('🚀 ~ startApp ~ urlPrefix:', urlPrefix);
    const apiUrl = !isNil(urlPrefix)
        ? `${appUrl}${urlPrefix.length > 0 ? `/${urlPrefix}` : urlPrefix}`
        : appUrl;
    console.log(`- AppUrl: ${chalk.green.underline(appUrl)}`);
    console.log();
    console.log(`- ApiUrl: ${chalk.green.underline(apiUrl)}`);
});
