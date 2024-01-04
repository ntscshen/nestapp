import { Repository } from 'typeorm';

import { CustomRepository } from '@/modules/database/decorators/repository.decorator';

import { PostEntity } from '../post.entity';
import { TagEntity } from '../tag.entity';

@CustomRepository(TagEntity)
export class TagRepository extends Repository<TagEntity> {
    buildBaseQB() {
        return this.createQueryBuilder('tag')
            .leftJoinAndSelect('tag.posts', 'posts')
            .addSelect((subQuery) => {
                return subQuery
                    .select('COUNT(posts.id)', 'postCount')
                    .from(PostEntity, 'p')
                    .where('posts.tagId = tag.id');
            })
            .orderBy('postCount', 'DESC')
            .loadRelationCountAndMap('tag.postCount', 'tag.posts');
    }
}
