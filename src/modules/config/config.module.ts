import { DynamicModule, Module } from '@nestjs/common';

import { Configure } from './configure';

// 自建配置系统，将整个配置模块Configure类的实例，注册成为一个模块，以方便在其他需要依赖的地方直接注入
@Module({})
export class ConfigModule {
    static forRoot(configure: Configure): DynamicModule {
        return {
            global: true,
            module: ConfigModule,
            providers: [
                {
                    provide: Configure,
                    useValue: configure,
                },
            ],
            exports: [Configure],
        };
    }
}
