import { Injectable } from '@nestjs/common';

import { isNil, omit } from 'lodash';
import { EntityNotFoundError } from 'typeorm';

import { treePaginate } from '@/modules/database/helpers';

import { UpdateCategoryDto } from '../dtos';
import { CategoryEntity } from '../entities';
import { CategoryRepository } from '../entities/repositories/category.repository';

@Injectable()
export class CategoryService {
    constructor(protected repository: CategoryRepository) {}

    // 查询分类树
    // findTree: 获取表中所有根(顶层父节点)的完整树结构
    async findTrees() {
        return this.repository.findTrees();
    }

    // 获取分页数据
    // 查询出分类数据、打平后、分页
    async paginate(options: any) {
        const tree = await this.repository.findTrees();
        const data = await this.repository.toFlatTrees(tree);
        return treePaginate(options, data);
    }

    // 获取数据详情
    async detail(id: string) {
        return this.repository.findOneOrFail({
            where: { id },
            relations: ['parent'],
        });
    }

    // 更新分类
    async update(data: UpdateCategoryDto) {
        await this.repository.update(data.id, omit(data, ['id', 'parent']));
        const item = await this.detail(data.id);

        const parent = await this.getParent(item.parent?.id, data.parent);
        if (parent) {
            const shouldUpdateParent =
                (!isNil(item.parent) && !isNil(parent) && item.parent.id !== parent.id) ||
                (isNil(item.parent) && !isNil(parent)) ||
                (!isNil(item.parent) && isNil(parent));
            if (shouldUpdateParent) {
                item.parent = parent;
                await this.repository.save(item, { reload: true });
            }
        }
        return item;
    }

    // 删除分类
    async delete(id: string) {
        const item = await this.repository.findOneOrFail({
            where: { id },
            relations: ['parent', 'children'],
        });

        // 把子分类提升一级
        if (!isNil(item.children) && item.children.length > 0) {
            const nchildren = [...item.children].map((c) => {
                c.parent = item.parent;
                return c;
            });
            await this.repository.save(nchildren, { reload: true });
        }

        return this.repository.remove(item);
    }

    // 新增分类
    async create(data: any) {
        const item = await this.repository.save({
            ...data,
            parent: await this.getParent(undefined, data.parent),
        });
        return this.detail(item.id);
    }

    /**
     * 获取请求传入的父分类
     * @param current 当前分类的ID
     * @param id
     * 根据提供的 parentId 查询并返回对应的父类实体
     * 通过ID去查找父分类实体。确保数据的完整性和逻辑的正确
     */
    protected async getParent(
        current?: string,
        parentId?: string,
    ): Promise<CategoryEntity | null | undefined> {
        if (current === parentId) return undefined; // 防止循环引用
        if (parentId === null || parentId === undefined) return null; // 未定义时返回null

        // 参数有效性检查 this.isValidId(parentId); 看后续情况添加

        return this.findParentCategory(parentId);
    }

    private async findParentCategory(parentId: string): Promise<CategoryEntity | null> {
        const parent = await this.repository.findOne({ where: { id: parentId } });

        if (parent) return parent;

        throw new EntityNotFoundError(CategoryEntity, `Parent category ${parentId} not exists!`);
    }
}
