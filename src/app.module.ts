import { Module } from '@nestjs/common';

import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';

import { content, database } from './config';
import { ContentModule } from './modules/content/content.module';
import { AppFilter, AppInterceptor, AppPipe } from './modules/core/providers';
import { DatabaseModule } from './modules/database/database.module';

@Module({
    imports: [ContentModule.forRoot(content), DatabaseModule.forRoot(database)],
    controllers: [],
    providers: [
        {
            provide: APP_PIPE,
            useValue: new AppPipe({
                transform: true,
                whitelist: true,
                forbidNonWhitelisted: true,
                forbidUnknownValues: true,
                validationError: { target: false },
            }),
        },
        {
            provide: APP_INTERCEPTOR,
            useClass: AppInterceptor,
        },
        {
            provide: APP_FILTER,
            useClass: AppFilter,
        },
    ],
})
export class AppModule {}
