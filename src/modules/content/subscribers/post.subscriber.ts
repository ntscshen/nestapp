import { Optional } from '@nestjs/common';
import { isNil } from 'lodash';
import { DataSource, EventSubscriber } from 'typeorm';

import { Configure } from '@/modules/config/configure';

import { BaseSubscriber } from '@/modules/database/base/subscriber';

import { PostBodyType } from '../constants';
import { PostEntity } from '../entities/post.entity';
import { SanitizeService } from '../services/sanitize.service';

@EventSubscriber()
export class PostSubscriber extends BaseSubscriber<PostEntity> {
    protected entity = PostEntity;

    constructor(
        protected dataSource: DataSource,
        protected configure: Configure,
        @Optional() protected sanitizeService?: SanitizeService,
    ) {
        super(dataSource);
    }

    listenTo() {
        return PostEntity;
    }

    /**
     * 加载文章数据的处理
     * @param entity
     */
    async afterLoad(entity: PostEntity) {
        const sanitizeService = (await this.configure.get('content.htmlEnabled'))
            ? this.container.get(SanitizeService)
            : undefined;
        if (!isNil(sanitizeService) && entity.type === PostBodyType.HTML) {
            entity.body = sanitizeService.sanitize(entity.body);
        }
    }
    // async afterLoad(entity: PostEntity) {
    //     const configure = app.container.get(Configure, { strict: false });
    //     const sanitizeService = (await configure.get('content.htmlEnabled'))
    //         ? app.container.get(SanitizeService)
    //         : undefined;
    //     // 这里的type是PostBodyType，自己定义的内容类型
    //     if (!isNil(sanitizeService) && entity.type === PostBodyType.HTML) {
    //         entity.body = sanitizeService.sanitize(entity.body);
    //     }
    // }
}
