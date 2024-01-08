import { DataSource, EventSubscriber } from 'typeorm';

import { PostBodyType } from '../constants';
import { PostEntity } from '../entities/post.entity';
import { PostRepository } from '../entities/repositories';
import { SanitizeService } from '../services/sanitize.service';

@EventSubscriber()
export class PostSubscriber {
    constructor(
        protected dataSource: DataSource,
        protected sanitizeService: SanitizeService,
        protected postRepository: PostRepository,
    ) {}

    listenTo() {
        return PostEntity;
    }

    // beforeInsert(event: any) {
    //     console.log('PostBodyType.HTML :>> ', PostBodyType.HTML);
    // }

    // afterInsert(event: any) {
    //     console.log('PostBodyType.HTML :>> ', PostBodyType.HTML);
    // }

    /**
     * 加载文章数据的处理
     * @param entity
     */
    async afterLoad(entity: PostEntity) {
        // 这里的type是PostBodyType，自己定义的内容类型
        if (entity.type === PostBodyType.HTML) {
            entity.body = this.sanitizeService.sanitize(entity.body);
        }
    }
}
