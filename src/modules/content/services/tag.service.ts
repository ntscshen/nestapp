import { Injectable } from '@nestjs/common';

import { omit } from 'lodash';

import { paginate } from '@/modules/database/helper';

import { CreateTagDto, QueryTagDto, UpdateTagDto } from '../dots';
import { TagRepository } from '../repositories';

@Injectable()
export class TagService {
    constructor(protected repository: TagRepository) {}

    // 获取标签数据
    async paginate(options: QueryTagDto) {
        const qb = this.repository.buildBaseQB();
        return paginate(qb, options);
    }

    // 查询单个标签信息
    async detail(id: string) {
        const qb = this.repository.buildBaseQB();
        qb.where(`tag.id = :id`, { id });
        return qb.getOneOrFail();
    }

    // 创建标签
    async create(data: CreateTagDto) {
        const item = await this.repository.save(data);
        return this.detail(item.id);
    }

    // 更新标签
    async update(data: UpdateTagDto) {
        await this.repository.update(data.id, omit(data, ['id']));
        return this.detail(data.id);
    }

    // 删除标签
    async delete(id: string) {
        const item = await this.repository.findOneByOrFail({ id });
        return this.repository.remove(item);
    }
}
