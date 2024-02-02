import { Module, ModuleMetadata } from '@nestjs/common';

import { Configure } from '../config/configure';
import { DatabaseModule } from '../database/database.module';

import { addEntities, addSubscribers } from '../database/helpers';

import * as controllers from './controllers';
import * as entities from './entities';
import * as repositories from './entities/repositories';
import { defaultContentConfig } from './helpers';
import * as services from './services';
import { PostService } from './services/post.service';
import { SanitizeService } from './services/sanitize.service';
import * as subscribers from './subscribers';
import { ContentConfig } from './types';

@Module({})
export class ContentModule {
    static async forRoot(configure: Configure) {
        const config = await configure.get<ContentConfig>('content', defaultContentConfig);
        const providers: ModuleMetadata['providers'] = [
            ...Object.values(services),
            ...(await addSubscribers(configure, Object.values(subscribers))),
            {
                provide: PostService,
                inject: [
                    repositories.PostRepository,
                    repositories.CategoryRepository,
                    services.CategoryService,
                    repositories.TagRepository,
                ],
                useFactory(
                    postRepository: repositories.PostRepository,
                    categoryRepository: repositories.CategoryRepository,
                    categoryService: services.CategoryService,
                    tagRepository: repositories.TagRepository,
                ) {
                    return new PostService(
                        postRepository,
                        categoryRepository,
                        categoryService,
                        tagRepository,
                        config.searchType,
                    );
                },
            },
        ];
        if (config.htmlEnabled) providers.push(SanitizeService);
        // console.log('object :>> ', addEntities(configure, Object.values(entities)));
        return {
            module: ContentModule,
            imports: [
                // TypeOrmModule.forFeature(Object.values(entities)),
                addEntities(configure, Object.values(entities)),
                DatabaseModule.forRepository(Object.values(repositories)),
            ],
            controllers: Object.values(controllers),
            providers,
            exports: [
                ...Object.values(services),
                PostService,
                DatabaseModule.forRepository(Object.values(repositories)),
            ],
        };
    }
}

// return {
//     module: ContentModule,
//     imports: [
//         TypeOrmModule.forFeature(Object.values(entities)),
//         DatabaseModule.forRepository(Object.values(repositories)),
//     ],
//     controllers: Object.values(controllers),
//     providers,
// };
