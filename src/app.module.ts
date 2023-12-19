import { Module } from '@nestjs/common';

import { database } from './config';
import { ContentModule } from './modules/content/content.module';
import { DatabaseModule } from './modules/database/database.module';

@Module({
    imports: [ContentModule, DatabaseModule.forRoot(database)],
    controllers: [],
    providers: [],
})
export class AppModule {}
