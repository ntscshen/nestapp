import { Module } from '@nestjs/common';

import { ContentModule } from './modules/content/content.module';

@Module({
    imports: [ContentModule],
    controllers: [],
    providers: [],
})
export class AppModule {}
