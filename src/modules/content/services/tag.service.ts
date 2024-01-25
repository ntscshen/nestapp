import { Injectable } from '@nestjs/common';

import { omit } from 'lodash';

import { BaseService } from '@/modules/database/base/service';
import { paginate } from '@/modules/database/helpers';

import { CreateTagDto, QueryTagDto, UpdateTagDto } from '../dtos';
import { TagEntity } from '../entities';
import { TagRepository } from '../entities/repositories/tag.repository';

@Injectable()
export class TagService extends BaseService<TagEntity, TagRepository> {
    protected enableTrash: boolean = true;

    constructor(protected repository: TagRepository) {
        super(repository);
    }

    /**
     * 查询单个标签信息
     * @param id
     * @param callback 添加额外的查询
     */
    async detail(id: string) {
        const qb = this.repository.buildBaseQueryBuilder();
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
        const qb = this.repository.buildBaseQueryBuilder();
        return paginate(qb, options);
    }
}
