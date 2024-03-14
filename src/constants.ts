import { join } from 'path';

import { NestFactory } from '@nestjs/core';

import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';

import { existsSync } from 'fs-extra';
import { isNil } from 'lodash';

import * as configs from './config';
import { CreateOptions } from './modules/config/types';
import { ContentModule } from './modules/content/content.module';
import * as dbCommands from './modules/database/commands';
import { DatabaseModule } from './modules/database/database.module';
import { Restful } from './modules/restful/restful';
import { RestfulModule } from './modules/restful/restful.module';
import { ApiConfig } from './modules/restful/types';

export const WEBAPP = 'web';
export const createData: CreateOptions = {
    config: {
        factories: configs as any, // 配置入口
        storage: { enabled: true }, // 存储配置选项
    },
    commands: () => [...Object.values(dbCommands)],
    modules: async (configure) => [
        DatabaseModule.forRoot(configure),
        RestfulModule.forRoot(configure),
        ContentModule.forRoot(configure),
    ],
    globals: {},
    builder: async ({ configure, BootModule }) => {
        const container = await NestFactory.create<NestFastifyApplication>(
            BootModule,
            new FastifyAdapter(),
            {
                cors: true,
                logger: ['error', 'warn'],
            },
        );
        console.log('configure :>> ', configure);
        if (!isNil(await configure.get<ApiConfig>('api', null))) {
            const restful = container.get(Restful);
            /**
             * 判断是否存在metadata模块,存在的话则加载并传入factoryDocs
             */
            let metadata: () => Promise<Record<string, any>>;

            if (existsSync(join(__dirname, 'metadata.js'))) {
                // eslint-disable-next-line global-require
                metadata = require(join(__dirname, 'metadata.js')).default;
            }
            if (existsSync(join(__dirname, 'metadata.ts'))) {
                // eslint-disable-next-line global-require
                metadata = require(join(__dirname, 'metadata.ts')).default;
            }
            await restful.factoryDocs(container, metadata);
        }
        return container;
    },
};
