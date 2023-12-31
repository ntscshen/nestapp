import { Repository } from 'typeorm';

import { CustomRepository } from '@/modules/database/decorators';

import { PostEntity, TagEntity } from '../entities';

@CustomRepository(TagEntity)
export class TagRepository extends Repository<TagEntity> {
    buildBaseQB() {
        return this.createQueryBuilder('tag')
            .leftJoinAndSelect('tag.posts', 'posts')
            .addSelect(
                (subQuery) => subQuery.select('COUNT(p.id)', 'count').from(PostEntity, 'p'),
                'postCount',
            )
            .orderBy('postCount', 'DESC')
            .loadRelationCountAndMap('tag.postCount', 'tag.posts');
    }
}

/*
this.createQueryBuilder('tag');
创建一个新的查询创建器，用于创建 SQL 查询。
*/
