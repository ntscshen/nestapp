import { pick, unset } from 'lodash';
import { FindOptionsUtils, FindTreeOptions, TreeRepository } from 'typeorm';

import { CustomRepository } from '@/modules/database/decorators/repository.decorator';

import { CategoryEntity } from '../category.entity';

@CustomRepository(CategoryEntity)
export class CategoryRepository extends TreeRepository<CategoryEntity> {
    buildBaseQB() {
        // 在查询分类时把它关联的父分类也顺带查询进去
        return this.createQueryBuilder('category').leftJoinAndSelect('category.parent', 'parent');
    }

    /**
     * 树形结构查询
     * @param options
     */
    async findTrees(
        options?: FindTreeOptions & {
            withTrashed?: boolean; // 查询需要同时查询回收站中的数据
            onlyTrashed?: boolean; // 仅查询回收站中的数据
        },
    ) {
        const roots = await this.findRoots(options);
        await Promise.all(roots.map((root) => this.findDescendantsTree(root, options)));
        return roots;
    }

    /**
     * 查询顶级分类
     * @param options
     */
    findRoots(
        options?: FindTreeOptions & {
            withTrashed?: boolean; // 查询需要同时查询回收站中的数据
            onlyTrashed?: boolean; // 仅查询回收站中的数据
        },
    ) {
        const escapeAlias = (alias: string) => this.manager.connection.driver.escape(alias);
        const escapeColumn = (column: string) => this.manager.connection.driver.escape(column);

        const joinColumn = this.metadata.treeParentRelation!.joinColumns[0];
        const parentPropertyName = joinColumn.givenDatabaseName || joinColumn.databaseName;

        const qb = this.buildBaseQB().orderBy('category.customOrder', 'ASC');
        qb.where(`${escapeAlias('category')}.${escapeColumn(parentPropertyName)} IS NULL`);
        FindOptionsUtils.applyOptionsToTreeQueryBuilder(qb, pick(options, ['relations', 'depth']));

        if (options?.withTrashed) {
            qb.withDeleted();
            if (options?.onlyTrashed) qb.where(`category.deletedAt IS NOT NULL`);
        }

        // 用来找出所有父节点列为 NULL 的记录，即树的根节点。然后执行查询并返回结果。
        return qb.getMany();
    }

    /**
     * 查询后代分类
     * 获取给定实体的所有子实体（后代）。以平面数组形式返回所有子实体。
     * @param entity
     * @param options
     */
    findDescendants(
        entity: CategoryEntity,
        options?: FindTreeOptions & {
            withTrashed?: boolean; // 查询需要同时查询回收站中的数据
            onlyTrashed?: boolean; // 仅查询回收站中的数据
        },
    ) {
        const qb = this.createDescendantsQueryBuilder('category', 'treeClosure', entity);
        FindOptionsUtils.applyOptionsToTreeQueryBuilder(qb, options);
        qb.orderBy('category.customOrder', 'ASC');
        if (options?.withTrashed) {
            qb.withDeleted();
            if (options?.onlyTrashed) qb.where(`category.deletedAt IS NOT NULL`);
        }
        return qb.getMany();
    }

    /**
     * 查询祖先分类
     * 获取给定实体的所有父级（祖先）。将它们全部以扁平数组的形式返回。
     * @param entity
     * @param options
     */
    findAncestors(
        entity: CategoryEntity,
        options?: FindTreeOptions & {
            withTrashed?: boolean; // 查询需要同时查询回收站中的数据
            onlyTrashed?: boolean; // 仅查询回收站中的数据
        },
    ) {
        const qb = this.createAncestorsQueryBuilder('category', 'treeClosure', entity);
        FindOptionsUtils.applyOptionsToTreeQueryBuilder(qb, options);
        qb.orderBy('category.customOrder', 'ASC');
        if (options.withTrashed) {
            qb.withDeleted();
            if (options.onlyTrashed) qb.where(`category.deletedAt IS NOT NULL`);
        }
        return qb.getMany();
    }

    /**
     * 统计后代元素数量
     * @param entity
     * @param options
     */
    async countDescendants(
        entity: CategoryEntity,
        options?: { withTrashed?: boolean; onlyTrashed?: boolean },
    ) {
        const qb = this.createDescendantsQueryBuilder('category', 'treeClosure', entity);
        if (options?.withTrashed) {
            qb.withDeleted();
            if (options?.onlyTrashed) qb.where(`category.deletedAt IS NOT NULL`);
        }
        return qb.getCount();
    }

    /**
     * 统计祖先元素数量
     * @param entity
     * @param options
     */
    async countAncestors(
        entity: CategoryEntity,
        options?: { withTrashed?: boolean; onlyTrashed?: boolean },
    ) {
        const qb = this.createAncestorsQueryBuilder('category', 'treeClosure', entity);
        if (options?.withTrashed) {
            qb.withDeleted();
            if (options?.onlyTrashed) qb.where(`category.deletedAt IS NOT NULL`);
        }
        return qb.getCount();
    }

    /**
     * 打平并展开树
     * 目的是将具有层级结构的 CategoryEntity 实体数组转换为一个扁平的数组结构，并为每个实体添加了 depth 和 parent 信息
     * 对于实现树形结构的数据展示和操作（例如在前端界面中）非常有用。
     * @param trees
     * @param depth
     * @param parent
     */
    async toFlatTrees(trees: CategoryEntity[], depth = 0, parent: CategoryEntity | null = null) {
        // Omit: 构造一个类型，它拥有类型 T 的属性，但不包括类型 K 中的属性。
        const data: Omit<CategoryEntity, 'children'>[] = [];
        for (const item of trees) {
            item.depth = depth;
            item.parent = parent;
            const { children } = item;
            // 移除对象路径上的属性children
            unset(item, 'children');
            data.push(item);
            data.push(...(await this.toFlatTrees(children, depth + 1, item)));
        }
        return data as CategoryEntity[];
    }
}
