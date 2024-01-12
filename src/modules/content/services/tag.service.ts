import { Injectable } from '@nestjs/common';

import { omit, isNil } from 'lodash';

import { In } from 'typeorm';

import { paginate } from '@/modules/database/helpers';

import { CreateTagDto, QueryTagDto, UpdateTagDto } from '../dtos';
import { TagRepository } from '../entities/repositories/tag.repository';

@Injectable()
export class TagService {
    constructor(protected repository: TagRepository) {}

    /**
     * 查询单个标签信息
     * @param id
     * @param callback 添加额外的查询
     */
    async detail(id: string) {
        const qb = this.repository.buildBaseQB();
        qb.where(`tag.id = :id`, { id });
        return qb.getOneOrFail();
    }

    /**
     * 创建标签
     * @param data
     */
    async create(data: CreateTagDto) {
        const item = await this.repository.save(data);
        return this.detail(item.id);
    }

    /**
     * 更新标签
     * @param data
     */
    async update(data: UpdateTagDto) {
        await this.repository.update(data.id, omit(data, ['id']));
        return this.detail(data.id);
    }

    /**
     * 获取标签数据
     * @param options 分页选项
     * @param callback 添加额外的查询
     */
    async paginate(options: QueryTagDto) {
        const qb = this.repository.buildBaseQB();
        return paginate(qb, options);
    }

    /**
     * 删除标签
     * @param id
     */
    async delete(ids: string[], trash?: boolean) {
        const items = await this.repository.find({
            where: { id: In(ids) } as any,
            withDeleted: true,
        });
        if (trash) {
            const softs = items.filter((item) => isNil(item.deletedAt));
            const directs = items.filter((item) => !isNil(item.deletedAt));
            return [
                ...(await this.repository.softRemove(softs)),
                ...(await this.repository.remove(directs)),
            ];
        }
        return this.repository.remove(items);
    }

    async restore(ids: string[]) {
        const items = await this.repository.find({
            where: { id: In(ids) } as any,
            withDeleted: true,
        });
        const trasheds = items.filter((item) => !isNil(item)).map((item) => item.id);
        if (trasheds.length < 1) return [];
        await this.repository.restore(trasheds);
        const qb = this.repository.buildBaseQB().where({ id: In(trasheds) });
        return qb.getMany();
    }
}
