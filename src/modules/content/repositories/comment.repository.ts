import { pick, unset } from 'lodash';
import {
    FindOptionsUtils,
    FindTreeOptions,
    SelectQueryBuilder,
    TreeRepository,
    TreeRepositoryUtils,
} from 'typeorm';

import { CustomRepository } from '@/modules/database/decorators';

import { CommentEntity } from '../entities';

type FindCommentTreeOptions = FindTreeOptions & {
    addQuery?: (query: SelectQueryBuilder<CommentEntity>) => SelectQueryBuilder<CommentEntity>;
};

@CustomRepository(CommentEntity)
export class CommentRepository extends TreeRepository<CommentEntity> {
    // 构建基础查询器
    buildBaseQB(qb: SelectQueryBuilder<CommentEntity>): SelectQueryBuilder<CommentEntity> {
        return qb
            .leftJoinAndSelect(`comment.parent`, 'parent')
            .leftJoinAndSelect(`comment.post`, 'post')
            .orderBy('comment.createdAt', 'DESC');
    }

    // 查询树
    // 返回一个包含所有顶级节点的数组。这样，可以轻松获取并展示树的顶部层级
    async findTrees(options: FindCommentTreeOptions = {}) {
        options.relations = ['parent', 'children'];
        const roots = await this.findRoots(options);
        await Promise.all(roots.map((root) => this.findDescendantsTree(root, options)));
        return roots;
    }

    // 查询顶级评论
    // 查找并返回树形结构中的根节点。在一个树形结构中，根节点是没有父节点的节点。
    findRoots(options: FindCommentTreeOptions = {}) {
        const { addQuery, ...rest } = options;
        const escapeAlias = (alias: string) => this.manager.connection.driver.escape(alias);
        const escapeColumn = (column: string) => this.manager.connection.driver.escape(column);

        const joinColumn = this.metadata.treeParentRelation!.joinColumns[0];
        const parentPropertyName = joinColumn.givenDatabaseName || joinColumn.databaseName;

        let qb = this.buildBaseQB(this.createQueryBuilder('comment'));
        FindOptionsUtils.applyOptionsToTreeQueryBuilder(qb, rest);
        qb.where(`${escapeAlias('comment')}.${escapeColumn(parentPropertyName)} IS NULL`);
        qb = addQuery ? addQuery(qb) : qb;
        return qb.getMany();
    }

    // 创建后代查询器
    // 一个定制的查询器，基于某个 CommentEntity后代的查询，通过传递的 options 参数来添加额外的查询逻辑
    // 可以用这个方法来构建一个复杂的查询，以获取满足特定条件的评论树
    createDtsQueryBuilder(
        closureTableAlias: string,
        entity: CommentEntity,
        options: FindCommentTreeOptions = {},
    ): SelectQueryBuilder<CommentEntity> {
        const { addQuery } = options;
        const qb = this.buildBaseQB(
            super.createDescendantsQueryBuilder('comment', closureTableAlias, entity),
        );
        return addQuery ? addQuery(qb) : qb;
    }

    // 查询后代树
    // 查找并返回指定节点的所有后代节点。后代节点包括指定节点的子节点、孙节点等。
    async findDescendantsTree(
        entity: CommentEntity,
        options: FindCommentTreeOptions = {},
    ): Promise<CommentEntity> {
        const qb: SelectQueryBuilder<CommentEntity> = this.createDtsQueryBuilder(
            'treeClosure',
            entity,
            options,
        );
        FindOptionsUtils.applyOptionsToTreeQueryBuilder(qb, pick(options, ['relations', 'depth']));
        const entities = await qb.getRawAndEntities();
        const relationMaps = TreeRepositoryUtils.createRelationMaps(
            this.manager,
            this.metadata,
            'comment',
            entities.raw,
        );
        TreeRepositoryUtils.buildChildrenEntityTree(
            this.metadata,
            entity,
            entities.entities,
            relationMaps,
            {
                depth: -1,
                ...pick(options, ['relations']),
            },
        );

        return entity;
    }

    // 打平并展开树
    // 该方法用于将树形结构转换为扁平化数组（或对象）结构。通常，树形结构是嵌套的、有层级的，而扁平化结构则将所有节点放在同一层级
    async toFlatTrees(trees: CommentEntity[], depth = 0) {
        const data: Omit<CommentEntity, 'children'>[] = [];
        for (const item of trees) {
            item.depth = depth;
            const { children } = item;
            unset(item, 'children');
            data.push(item);
            data.push(...(await this.toFlatTrees(children, depth + 1)));
        }
        return data as CommentEntity[];
    }
}
