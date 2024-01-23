import { BaseRepository } from '@/modules/database/base/repository';
import { CustomRepository } from '@/modules/database/decorators/repository.decorator';

import { CommentEntity } from '../comment.entity';
import { PostEntity } from '../post.entity';

@CustomRepository(PostEntity) // 将PostEntity添加到当前类上
export class PostRepository extends BaseRepository<PostEntity> {
    protected _qbName = 'post';

    buildBaseQB() {
        // 在查询之前先查询出评论数量在添加到commentCount字段上
        return this.buildBaseQb()
            .leftJoinAndSelect(`${this.qbName}.category`, 'category')
            .leftJoinAndSelect(`${this.qbName}.tags`, 'tags')
            .addSelect((subQuery) => {
                return subQuery
                    .select('COUNT(c.id)', 'count')
                    .from(CommentEntity, 'c')
                    .where(`c.post.id = ${this.qbName}.id`);
            }, 'commentCount')
            .loadRelationCountAndMap(`${this.qbName}.commentCount`, `${this.qbName}.comments`);
    }
}

// decorator /'dekəreɪtə/ 装饰工 油漆匠
