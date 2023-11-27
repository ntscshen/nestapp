import { unset } from 'lodash';
import { FindOptionsUtils, FindTreeOptions, TreeRepository } from 'typeorm';

import { CustomRepository } from '@/modules/database/decorators';

import { CategoryEntity } from '../entities';

@CustomRepository(CategoryEntity)
export class CategoryRepository extends TreeRepository<CategoryEntity> {
    // 构建基础查询器
    buildBaseQB() {
        // createQueryBuilder 创建一个新的查询创建器，用于创建SQL查询
        return this.createQueryBuilder('category').leftJoinAndSelect('category.parent', 'parent');
    }

    // 查询顶级分类
    // 该方法用于查找并返回树形结构中的根节点。( 在一个树形结构中，根节点是一个没有父节点的节点 )
    findRoots(options?: FindTreeOptions) {
        const escapeAlias = (alias: string) => this.manager.connection.driver.escape(alias);
        const escapeColumn = (column: string) => this.manager.connection.driver.escape(column);

        const joinColumn = this.metadata.treeParentRelation!.joinColumns[0];
        const parentPropertyName = joinColumn.givenDatabaseName || joinColumn.databaseName;
        const qb = this.buildBaseQB().orderBy('category.customOrder', 'ASC');
        FindOptionsUtils.applyOptionsToTreeQueryBuilder(qb, options);

        return qb
            .where(`${escapeAlias('category')}.${escapeColumn(parentPropertyName)} IS NULL`)
            .getMany();
    }

    // 查询后代分类 descendants  /dɪˈsendənt/ n.后代，后裔
    // 该方法用于查找并返回指定节点的所有后代节点。( 后代节点包括指定节点的子节点、孙节点等 )
    findDescendants(entity: CategoryEntity, options?: FindTreeOptions) {
        const qb = this.createDescendantsQueryBuilder('category', 'treeClosure', entity);
        FindOptionsUtils.applyOptionsToTreeQueryBuilder(qb, options);
        qb.orderBy('category.customOrder', 'ASC');
        return qb.getMany();
    }

    // 查询祖先分类
    // 该方法用于查找并返回指定节点的所有祖先结点。( 祖先结点是指定节点的父节点、组父节点等 )
    findAncestors(entity: CategoryEntity, options?: FindTreeOptions) {
        const qb = this.createAncestorsQueryBuilder('category', 'treeClosure', entity);
        FindOptionsUtils.applyOptionsToTreeQueryBuilder(qb, options);
        qb.orderBy('category.customOrder', 'ASC');
        return qb.getMany();
    }

    // 打平并展开树
    // 该方法用于将树形结构转化为扁平化数组(或对象)的结构。通常，树形结构嵌套的、有层级的，而扁平化结构则将所有节点放在
    // 同一个层级，通常会使用一些引用字段( 如 parentId ) 来表示节点之间的关系
    async toFlatTrees(trees: CategoryEntity[], depth = 0, parent: CategoryEntity | null = null) {
        const data: Omit<CategoryEntity, 'children'>[] = [];
        for (const item of trees) {
            item.depth = depth;
            item.parent = parent;
            const { children } = item;
            unset(item, 'children'); // 这个方法用于删除对象的特定属性
            data.push(item);
            data.push(...(await this.toFlatTrees(children, depth + 1, item)));
        }
        return data as CategoryEntity[];
    }
}
