import { NestFactory } from '@nestjs/core';

import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';

import * as configs from './config';
import { CreateOptions } from './modules/config/types';
import { ContentModule } from './modules/content/content.module';
import { DatabaseModule } from './modules/database/database.module';

export const WEBAPP = 'web';
export const createData: CreateOptions = {
    config: {
        factories: configs as any,
        storage: { enabled: true },
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
