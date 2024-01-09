import { pick, unset } from 'lodash';
import {
    FindOptionsUtils,
    FindTreeOptions,
    SelectQueryBuilder,
    TreeRepository,
    TreeRepositoryUtils,
} from 'typeorm';

import { CustomRepository } from '@/modules/database/decorators/repository.decorator';

import { CommentEntity } from '../comment.entity';

type FindCommentTreeOptions = FindTreeOptions & {
    addQuery?: (query: SelectQueryBuilder<CommentEntity>) => SelectQueryBuilder<CommentEntity>;
};
@CustomRepository(CommentEntity)
export class CommentRepository extends TreeRepository<CommentEntity> {
    // 基础查询
    buildBaseQB(qb: SelectQueryBuilder<CommentEntity>): SelectQueryBuilder<CommentEntity> {
        return qb
            .leftJoinAndSelect(`comment.parent`, 'parent')
            .leftJoinAndSelect(`comment.post`, 'post')
            .orderBy('comment.createdAt', 'DESC');
    }

    // 查询树
    async findTrees(options: FindCommentTreeOptions = {}) {
        options.relations = ['parent', 'children'];
        const roots = await this.findRoots(options); // 找到所有根节点
        console.log(
            '🚀 ~ file: comment.repository.ts:31 ~ CommentRepository ~ findTrees ~ roots:',
            roots,
        );
        const promises = roots.map((root) => this.findDescendantsTree(root, options));

        await Promise.all(promises);
        // descendant /dɪˈsendənt/ n.后代
        // findDescendantsTree
        // 获取给定实体的所有子实体（后代）。以树形形式返回--相互嵌套。
        return roots;
    }

    /**
     * 查询顶级评论
     * @param options
     */
    findRoots(options: FindCommentTreeOptions = {}) {
        const { addQuery, ...rest } = options;
        const escapeAlias = (alias: string) => this.manager.connection.driver.escape(alias);
        const escapeColumn = (column: string) => this.manager.connection.driver.escape(column);

        const joinColumn = this.metadata.treeParentRelation!.joinColumns[0];
        const parentPropertyName = joinColumn.givenDatabaseName || joinColumn.databaseName;

        let qb = this.buildBaseQB(this.createQueryBuilder('comment'));
        FindOptionsUtils.applyOptionsToTreeQueryBuilder(qb, rest);
        // 找出所有为NULL的记录
        qb.where(`${escapeAlias('comment')}.${escapeColumn(parentPropertyName)} IS NULL`);
        qb = addQuery ? addQuery(qb) : qb;
        return qb.getMany();
    }

    /**
     * 创建后代查询器
     * @param closureTableAlias
     * @param entity
     * @param options
     */
    createDtsQueryBuilder(
        closureTableAlias: string,
        entity: CommentEntity,
        options: FindCommentTreeOptions = {},
    ): SelectQueryBuilder<CommentEntity> {
        const { addQuery } = options; // 用于在查询器上添加额外的查询逻辑
        const qb = this.buildBaseQB(
            // 创建一个查询生成器，用于获取树中实体的后代
            super.createDescendantsQueryBuilder('comment', closureTableAlias, entity),
        );
        return addQuery ? addQuery(qb) : qb;
    }

    /**
     * 查询后代树
     * @param entity
     * @param options
     */
    async findDescendantsTree(
        entity: CommentEntity,
        options: FindCommentTreeOptions = {},
    ): Promise<CommentEntity> {
        const qb: SelectQueryBuilder<CommentEntity> = this.createDtsQueryBuilder(
            'treeClosure',
            entity,
            options,
        );
        // 将提供的选项(关于关联关系和查询深度)应用到一个树形结构的查询构建器上
        FindOptionsUtils.applyOptionsToTreeQueryBuilder(qb, pick(options, ['relations', 'depth']));
        // 执行查询生成器生成的 sql，并返回包含原始结果和由此创建的实体的对象。
        const entities = await qb.getRawAndEntities(); // 执行之前构建的SQL查询，并返回查询结果(原始数据和映射实体类的数据)

        // 用于创建一个映射，这个映射表明了实体之间的关系，特别是在树形结构中
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

        // TreeRepositoryUtils.createRelationMaps 和 TreeRepositoryUtils.buildChildrenEntityTree 这两个方法是必须要使用的吗？我们之前在Entity中已经添加了对应的@Tree('materialized-path')和@TreeChildren和@TreeParent了。

        return entity;
    }

    /**
     * 打平并展开树
     * @param trees
     * @param depth
     */
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
