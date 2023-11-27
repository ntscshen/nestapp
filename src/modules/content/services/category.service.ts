import { Injectable } from '@nestjs/common';

import { isNil, omit } from 'lodash';
import { EntityNotFoundError } from 'typeorm';

import { treePaginate } from '@/modules/database/helper';

import { CreateCategoryDto, QueryCategoryDto, UpdateCategoryDto } from '../dots';
import { CategoryEntity } from '../entities';
import { CategoryRepository } from '../repositories';

@Injectable()
export class CategoryService {
    constructor(protected repository: CategoryRepository) {}

    // 查询分类树
    async findTrees() {
        // 获取表中所有根的完整树
        return this.repository.findTrees();
    }

    // 获取分页数据
    async paginate(options: QueryCategoryDto) {
        const tree = await this.repository.findTrees();
        const data = await this.repository.toFlatTrees(tree);
        return treePaginate(options, data);
    }

    // 获取数据详情
    async detail(id: string) {
        // 根据给定的查找选项找第一个实体，如果在数据库中没有找到，则以错误方式拒绝
        return this.repository.findOneOrFail({
            where: { id },
            relations: ['parent'],
        });
    }

    // 新增分类
    async create(data: CreateCategoryDto) {
        const item = await this.repository.save({
            ...data,
            parent: await this.getParent(undefined, data.parent),
        });
        return this.detail(item.id);
    }

    // 删除分类
    async delete(id: string) {
        const item = await this.repository.findOneOrFail({
            where: { id },
            relations: ['parent', 'children'],
        });
        console.log('🚀 ~ file: category.service.ts:69 ~ CategoryService ~ delete ~ item:', item);
        // 把子分类提升一级
        if (!isNil(item.children) && item.children.length > 0) {
            const nchildren = [...item.children].map((c) => {
                c.parent = item.parent;
                return item;
            });
            await this.repository.save(nchildren, { reload: true });
        }
        return this.repository.remove(item);
    }

    // 更新分类
    async update(data: UpdateCategoryDto) {
        await this.repository.update(data.id, omit(data, ['id', 'parent']));
        const item = await this.detail(data.id);
        const parent = await this.getParent(item.parent?.id, data.parent);
        const shouldUpdateParent =
            (!isNil(item.parent) && !isNil(parent) && item.parent.id !== parent.id) ||
            (isNil(item.parent) && !isNil(parent)) ||
            (!isNil(item.parent) && isNil(parent));
        // 父分类单独更新
        if (parent !== undefined && shouldUpdateParent) {
            item.parent = parent;
            await this.repository.save(item, { reload: true });
        }
        return item;
    }

    // 获取请求传入的父分类
    // current 当前份分类的ID
    // id
    protected async getParent(current?: string, parentId?: string) {
        if (current === parentId) return undefined;
        let parent: CategoryEntity | undefined;
        if (parentId !== undefined) {
            if (parentId === null) return null;
            parent = await this.repository.findOne({ where: { id: parentId } });
            if (!parent)
                throw new EntityNotFoundError(
                    CategoryEntity,
                    `Parent category ${parentId} not exists!`,
                );
        }
        return parent;
    }
}
