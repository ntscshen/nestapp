import { BaseRepository } from '@/modules/database/base/repository';
import { CustomRepository } from '@/modules/database/decorators/repository.decorator';

import { PostEntity } from '../post.entity';
import { TagEntity } from '../tag.entity';

@CustomRepository(TagEntity)
export class TagRepository extends BaseRepository<TagEntity> {
    protected _qbName: string = 'tag';

    buildBaseQueryBuilder() {
        return this.buildBaseQB()
            .leftJoinAndSelect('tag.posts', 'posts')
            .addSelect(
                (subQuery) => subQuery.select('COUNT(p.id)', 'postCount').from(PostEntity, 'p'),
                'postCount',
            )
            .orderBy('postCount', 'DESC')
            .loadRelationCountAndMap('tag.postCount', 'tag.posts');
    }
}
