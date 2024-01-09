import { NestFactory } from '@nestjs/core';

import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';

import { AppModule } from './app.module';

async function bootstrap() {
    // 使用 fastify 驱动
    const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter(), {
        // 启动跨域访问
        cors: true,
        // 只使用 error 和 warn 两种输出，避免在控制台冗余输出
        // logger: ['error', 'warn'],
    });
    // 设置全局访问前缀
    app.setGlobalPrefix('api');
    // 允许跨越
    await app.listen(3000, '0.0.0.0');
    console.log('api >> : http://localhost:3000');
}
bootstrap();
