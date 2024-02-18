import { NestFactory } from '@nestjs/core';

import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';

import * as configs from './config';
import { CreateOptions } from './modules/config/types';
import { ContentModule } from './modules/content/content.module';
import { DatabaseModule } from './modules/database/database.module';

export const WEBAPP = 'web';
export const createData: CreateOptions = {
    config: {
        factories: configs as any, // 配置入口
        storage: { enabled: true }, // 存储配置选项
    },
    modules: async (configure) => [
        ContentModule.forRoot(configure),
        DatabaseModule.forRoot(configure),
    ],
    globals: {},
    builder: async ({ configure, BootModule }) =>
        NestFactory.create<NestFastifyApplication>(BootModule, new FastifyAdapter(), {
            cors: true,
            logger: ['error', 'warn'],
        }),
};
