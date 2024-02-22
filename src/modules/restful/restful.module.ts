import { Module } from '@nestjs/common';

import { Configure } from '../config/configure';

import { Restful } from './restful';

@Module({})
export class RestfulModule {
    static async forRoot(configure: Configure) {
        const restful = new Restful(configure);

        // {
        //     title: '3R_ntscshen',
        //     description: '3R_ntscshen_TS全栈开发',
        //     auth: true,
        //     docuri: 'api/docs',
        //     default: 'v1',
        //     enabled: [],
        //     versions: { v1: { routes: [Array] } }
        //   }

        await restful.create(await configure.get('api'));
        return {
            module: RestfulModule,
            global: true,
            imports: restful.getModuleImports(),
            providers: [
                {
                    provide: Restful,
                    useValue: restful,
                },
            ],
            exports: [Restful],
        };
    }
}
