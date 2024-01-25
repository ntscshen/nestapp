import { isNil, pick, unset } from 'lodash';
import {
    FindOptionsUtils,
    FindTreeOptions,
    ObjectLiteral,
    SelectQueryBuilder,
    TreeRepository,
    TreeRepositoryUtils,
} from 'typeorm';

import { TreeChildrenResolve } from '../constants';
import { getOrderByQuery } from '../helpers';
import { OrderQueryType, QueryParams } from '../types';

/**
 * 基础树存储类
 * tip: 不需要成为抽象类，因为_qbName默认为treeEntity
 * */
export class BaseTreeRepository<E extends ObjectLiteral> extends TreeRepository<E> {
    // 查询器名称
    protected _qbName = 'treeEntity';

    // 删除父分类后是否提升子分类的等级
    protected _childrenResolve?: TreeChildrenResolve;

    // 默认排序规则，可以通方法的orderBy参数覆盖
    protected orderBy?: OrderQueryType;

    /**
     * 返回查询器名称
     */
    get qbName(): string {
        return this._qbName;
    }

    /**
     * 返回子分类的等级
     */
    get childrenResolve(): TreeChildrenResolve {
        return this._childrenResolve;
    }

    /**
     * 构建基础查询器
     */
    buildBaseQB(qb?: SelectQueryBuilder<E>): SelectQueryBuilder<E> {
        const queryBuilder = qb ?? this.createQueryBuilder(this.qbName);
        return queryBuilder.leftJoinAndSelect(`${this.qbName}.parent`, 'parent');
    }

    /**
     * 生成排序的QueryBuilder
     * @param qb
     * @param orderBy
     * */
    addOrderByQuery(qb: SelectQueryBuilder<E>, orderBy?: OrderQueryType): SelectQueryBuilder<E> {
        const orderByQuery = orderBy ?? this.orderBy;
        return isNil(orderByQuery) ? qb : getOrderByQuery(qb, this.qbName, orderByQuery);
    }

    /**
     * 查询树形分类
     * @param options 查询参数
     * */
    async findTrees(options?: FindTreeOptions & QueryParams<E>): Promise<E[]> {
        const roots = await this.findRoots(options);
        await Promise.all(roots.map((root) => this.findDescendantsTree(root, options)));
        return roots;
    }

    /**
     * 查询后代树
     * @param entity
     * @param options
     */
    async findDescendantsTree(entity: E, options?: FindTreeOptions & QueryParams<E>) {
        const { addQuery, orderBy, withTrashed, onlyTrashed } = options ?? {};
        // 1. 在原有查询基础上，要添加一层leftJoinAndSelect('parent')
        let qb = this.buildBaseQB(
            this.createDescendantsQueryBuilder(this.qbName, 'treeClosure', entity),
        );
        // 2. 增加排序逻辑
        qb = addQuery
            ? await addQuery(this.addOrderByQuery(qb, orderBy))
            : this.addOrderByQuery(qb, orderBy);
        // 3. 增加软删除逻辑
        if (withTrashed) {
            qb.withDeleted();
            if (onlyTrashed) qb.where(`${this.qbName}.deletedAt IS NOT NULL`);
        }
        FindOptionsUtils.applyOptionsToTreeQueryBuilder(qb, pick(options, ['relations', 'depth']));
        const entities = await qb.getRawAndEntities();
        const relationMaps = TreeRepositoryUtils.createRelationMaps(
            this.manager,
            this.metadata,
            this.qbName,
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

    /**
     * 查询祖先树
     * @param entity
     * @param options
     * */
    async findAncestorsTree(entity: E, options?: FindTreeOptions & QueryParams<E>): Promise<E> {
        const { addQuery, orderBy, withTrashed, onlyTrashed } = options ?? {};
        // 1. 连接treeEntity表，并将parent关联到qb
        const qb = this.buildBaseQB(
            this.createAncestorsQueryBuilder(this.qbName, 'treeClosure', entity),
        );
        // 2. 增加排序逻辑
        if (addQuery) {
            // 调用addQuery函数，参数传递的是qb。addOrderByQuery生成排序的QueryBuilder
            await addQuery(this.addOrderByQuery(qb, orderBy));
        } else {
            this.addOrderByQuery(qb, orderBy);
        }
        // 3. 增加软删除逻辑
        if (withTrashed) {
            qb.withDeleted();
            if (onlyTrashed) qb.where(`${this.qbName}.deletedAt IS NOT NULL`);
        }

        FindOptionsUtils.applyOptionsToTreeQueryBuilder(qb, pick(options, ['relations', 'depth']));
        const entities = await qb.getRawAndEntities();
        const relationMaps = TreeRepositoryUtils.createRelationMaps(
            this.manager,
            this.metadata,
            this.qbName,
            entities.raw,
        );
        TreeRepositoryUtils.buildParentEntityTree(
            this.metadata,
            entity,
            entities.entities,
            relationMaps,
        );
        return entity;
    }

    /**
     * 查询后代元素
     * @param entity
     * @param options
     * */
    async findDescendants(entity: E, options?: FindTreeOptions & QueryParams<E>): Promise<E[]> {
        const { addQuery, orderBy, withTrashed, onlyTrashed } = options ?? {};
        // 1. 在原有查询基础上，要添加一层leftJoinAndSelect('parent')
        let qb = this.buildBaseQB(
            this.createDescendantsQueryBuilder(this.qbName, 'treeClosure', entity),
        );
        // 2. 增加排序逻辑
        if (addQuery) {
            qb = await addQuery(this.addOrderByQuery(qb, orderBy));
        } else {
            this.addOrderByQuery(qb, orderBy);
        }
        // 3. 增加软删除逻辑
        if (withTrashed) {
            qb.withDeleted();
            if (onlyTrashed) qb.where(`${this.qbName}.deletedAt IS NOT`);
        }
        FindOptionsUtils.applyOptionsToTreeQueryBuilder(qb, options);
        return qb.getMany();
    }

    /**
     * 查询祖先元素
     * @param entity
     * @param options
     * */
    async findAncestors(entity: E, options?: FindTreeOptions & QueryParams<E>): Promise<E[]> {
        const { addQuery, orderBy, withTrashed, onlyTrashed } = options ?? {};
        // 1. 连接treeEntity表，并将parent关联到qb
        let qb = this.buildBaseQB(
            this.createAncestorsQueryBuilder(this.qbName, 'treeClosure', entity),
        );
        // 2. 增加排序逻辑
        if (addQuery) {
            qb = await addQuery(this.addOrderByQuery(qb, orderBy));
        } else {
            this.addOrderByQuery(qb, orderBy);
        }
        // 3. 增加软删除逻辑
        if (withTrashed) {
            qb.withDeleted();
            if (onlyTrashed) qb.where(`${this.qbName}.deletedAt IS NOT NULL`);
        }
        FindOptionsUtils.applyOptionsToTreeQueryBuilder(qb, options);
        return qb.getMany();
    }

    /**
     * 统计后代元素数量
     * @param entity
     * @param options
     */
    async countDescendants(entity: E, options?: FindTreeOptions & QueryParams<E>) {
        const { addQuery, orderBy, withTrashed, onlyTrashed } = options ?? {};
        let qb = this.createDescendantsQueryBuilder(this.qbName, 'treeClosure', entity);
        qb = addQuery
            ? await addQuery(this.addOrderByQuery(qb, orderBy))
            : this.addOrderByQuery(qb, orderBy);
        if (withTrashed) {
            qb.withDeleted();
            if (onlyTrashed) qb.where(`${this.qbName}.deletedAt IS NOT NULL`);
        }
        return qb.getCount();
    }

    /**
     * 统计祖先元素数量
     * @param entity
     * @param options
     */
    async countAncestors(entity: E, options?: FindTreeOptions & QueryParams<E>) {
        const { addQuery, orderBy, withTrashed, onlyTrashed } = options ?? {};
        let qb = this.createAncestorsQueryBuilder(this.qbName, 'treeClosure', entity);
        qb = addQuery
            ? await addQuery(this.addOrderByQuery(qb, orderBy))
            : this.addOrderByQuery(qb, orderBy);
        if (withTrashed) {
            qb.withDeleted();
            if (onlyTrashed) qb.where(`${this.qbName}.deletedAt IS NOT NULL`);
        }
        return qb.getCount();
    }

    /**
     * 树形结构数据扁平化
     * @param trees
     * @param level
     */
    async toFlatTrees1(trees: E[], depth = 0, parent: E | null = null): Promise<E[]> {
        const data: Omit<E, 'children'>[] = [];
        for (const item of trees) {
            (item as any).depth = depth;
            (item as any).parent = parent;
            const { children } = item;
            unset(item, 'children');
            data.push(item);
            data.push(...(await this.toFlatTrees(children, depth + 1, item)));
        }
        return data as E[];
    }

    async toFlatTrees(trees: E[], depth = 0, parent: E | null = null): Promise<E[]> {
        let data: Omit<E, 'children'>[] = [];

        for (const item of trees) {
            // 创建不包含 children 的节点副本
            const { children, ...nodeWithoutChildren } = item as any;

            // 添加 depth 和 parent 属性
            const nodeWithDepthAndParent = {
                ...nodeWithoutChildren,
                depth,
                parent,
            };

            // 将副本添加到 data 数组中
            data.push(nodeWithDepthAndParent);

            // 如果存在 children，则递归处理
            if (children && children.length) {
                data = data.concat(await this.toFlatTrees(children, depth + 1, item));
            }
        }
        return data as E[];
    }
}
