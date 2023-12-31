import { Module } from '@nestjs/common';

import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';

import { database } from './config';
import { ContentModule } from './modules/content/content.module';
import { AppInterceptor, AppPipe } from './modules/core/providers';
import { AppFilter } from './modules/core/providers/app.filter';
import { DatabaseModule } from './modules/database/database.module';

@Module({
    imports: [ContentModule, DatabaseModule.forRoot(database)],
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
