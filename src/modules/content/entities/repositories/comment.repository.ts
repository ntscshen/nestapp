import { isNil } from 'lodash';
import { FindTreeOptions, SelectQueryBuilder } from 'typeorm';

import { BaseTreeRepository } from '@/modules/database/base/tree.repository';
import { CustomRepository } from '@/modules/database/decorators/repository.decorator';

import { QueryParams } from '@/modules/database/types';

import { CommentEntity } from '../comment.entity';

// type FindCommentTreeOptions = FindTreeOptions & {
//     addQuery?: (query: SelectQueryBuilder<CommentEntity>) => SelectQueryBuilder<CommentEntity>;
// };
@CustomRepository(CommentEntity)
export class CommentRepository extends BaseTreeRepository<CommentEntity> {
    protected _qbName = 'comment';

    protected orderBy = 'createdAt';

    // 基础查询
    buildBaseQB(qb: SelectQueryBuilder<CommentEntity>): SelectQueryBuilder<CommentEntity> {
        return super.buildBaseQB(qb).leftJoinAndSelect(`${this.qbName}.post`, 'post');
    }

    // 查询树
    async findTrees(
        options: FindTreeOptions & QueryParams<CommentEntity> & { post?: string } = {},
    ): Promise<CommentEntity[]> {
        return super.findTrees({
            ...options,
            addQuery: async (qb) => {
                return isNil(options.post) ? qb : qb.where('post.id = :id', { id: options.post });
            },
        });
    }
}
