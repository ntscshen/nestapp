import { Injectable } from '@nestjs/common';

import { isNil, omit } from 'lodash';
import { EntityNotFoundError } from 'typeorm';

import { BaseService } from '@/modules/database/base/service';

import { SelectTrashMode } from '../constants';
import { CreateCategoryDto, QueryCategoryTreeDto, UpdateCategoryDto } from '../dtos';
import { CategoryEntity } from '../entities';
import { CategoryRepository } from '../entities/repositories/category.repository';

@Injectable()
export class CategoryService extends BaseService<CategoryEntity, CategoryRepository> {
    protected enableTrash = true;

    constructor(protected repository: CategoryRepository) {
        super(repository);
    }

    // 新增分类
    async create(data: CreateCategoryDto) {
        const item = await this.repository.save({
            ...data,
            parent: await this.getParent(undefined, data.parent),
        });
        return this.detail(item.id);
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

    // 获取数据详情
    async detail(id: string) {
        return this.repository.findOneOrFail({
            where: { id },
            relations: ['parent'],
        });
    }

    // 查询分类树
    // findTree: 获取表中所有根(顶层父节点)的完整树结构
    async findTrees(options: QueryCategoryTreeDto) {
        const { trashed = SelectTrashMode.NONE } = options; // 包含未软删除的数据
        return this.repository.findTrees({
            withTrashed: trashed === SelectTrashMode.ALL || trashed === SelectTrashMode.ONLY,
            onlyTrashed: trashed === SelectTrashMode.ONLY,
        });
    }

    // /**
    //  * 恢复分类
    //  * @param ids
    //  */
    // async restore(ids: string[]) {
    //     const items = await this.repository.find({
    //         where: { id: In(ids) } as any,
    //         withDeleted: true,
    //     });
    //     const trasheds = items.filter((item) => !isNil(item.deletedAt)).map((item) => item.id);
    //     if (trasheds.length < 1) return [];

    //     await this.repository.restore(trasheds);
    //     const qb = this.repository.buildBaseQB().where({ id: In(trasheds) });
    //     return qb.getMany();
    // }

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
