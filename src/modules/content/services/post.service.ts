import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { isFunction, isNil, omit } from 'lodash';
import {
    DataSource,
    EntityNotFoundError,
    IsNull,
    Not,
    Repository,
    SelectQueryBuilder,
} from 'typeorm';

import { paginate } from '@/modules/database/helpers';
import { QueryHook } from '@/modules/database/types';

import { PostOrderType } from '../constants';
import { CreatePostDto, QueryPostDto, UpdatePostDto } from '../dtos';
import { PostEntity } from '../entities/post.entity';
import { PostRepository } from '../entities/repositories';

// src/modules/content/services/post.service.ts
@Injectable()
export class PostService {
    // constructor(protected repository: PostRepository) {}
    constructor(
        @InjectRepository(PostEntity)
        protected repository: Repository<PostEntity>,

        private datasource: DataSource,
        private postRepository: PostRepository,
    ) {}

    /**
     * 获取分页数据
     * @param options 分页选项
     * @param callback 添加额外的查询
     */
    async paginate(options: QueryPostDto, callback?: QueryHook<PostEntity>) {
        console.log('🚀 ~ file: post.service.ts:38 ~ PostService ~ paginate ~ options:', options);
        const queryBuilder = this.postRepository.createQueryBuilder('post');
        // const post = await this.postRepository.findOne({
        //     where: { id: '7b1a6bd3-e5e4-4786-876c-731ebcec55e3' },
        // });
        // console.log('🚀 ~ file: post.service.ts:42 ~ PostService ~ paginate ~ post:', post);
        // const queryBuilder = this.repository.createQueryBuilder('post');
        const qb = await this.buildListQuery(queryBuilder, options, callback);
        return paginate(qb, options); // 这里的paginate是一个工具方法
    }

    /**
     * 查询单篇文章
     * @param id
     * @param callback 添加额外的查询
     */
    async detail(id: string, callback?: QueryHook<PostEntity>) {
        // let qb = this.postRepository.createQueryBuilder('post');
        let qb = this.repository.createQueryBuilder('post');
        // let qb = this.repository.buildBaseQB();
        qb.where(`post.id = :id`, { id });
        qb = !isNil(callback) && isFunction(callback) ? await callback(qb) : qb;
        const item = await qb.getOne();
        if (!item) throw new EntityNotFoundError(PostEntity, `The post ${id} not exists!`);
        console.log('item :>> ', item);
        return item;
        // const result = await this.repository.findOneBy({ id });
        // console.log('🚀 ~ file: post.service.ts:43 ~ PostService ~ detail ~ result:', result);
    }

    async detail2(id: string, callback?: QueryHook<PostEntity>): Promise<PostEntity | null> {
        // 通过 createQueryBuilder 构建查询，提供了更灵活的方式来构建和修改查询
        // const queryBuilder = this.repository.createQueryBuilder('post');
        const queryBuilder = this.datasource.createQueryBuilder(PostEntity, 'post');
        // 应用callback以添加额外的查询条件或修改
        if (callback) {
            callback(queryBuilder);
        }

        // 完成查询并返回结果
        const post = await queryBuilder.where('post.id = :id', { id }).getOne();
        return post;
    }

    /**
     * 创建文章
     * @param data
     */
    async create(data: CreatePostDto) {
        const item = await this.repository.save(data);
        return this.detail(item.id);
    }

    /**
     * 更新文章
     * @param data
     */
    async update(data: UpdatePostDto) {
        const result = await this.repository.update(data.id, omit(data, ['id']));
        if (result.affected === 0) {
            throw new Error('No item was updated');
        }
        // return this.detail(data.id);
    }

    /**
     * 删除文章
     * @param id
     */
    async delete(id: string) {
        const item = await this.repository.findOneByOrFail({ id });
        return this.repository.remove(item);
    }

    /**
     * 构建文章列表查询器
     * @param qb 初始查询构造器
     * @param options 排查分页选项后的查询选项
     * @param callback 添加额外的查询
     */
    protected async buildListQuery(
        qb: SelectQueryBuilder<PostEntity>,
        options: Record<string, any>,
        callback?: QueryHook<PostEntity>,
    ) {
        const { orderBy, isPublished } = options;
        let newQb = qb;
        if (typeof isPublished === 'boolean') {
            newQb = isPublished
                ? newQb.where({
                      publishedAt: Not(IsNull()),
                  })
                : newQb.where({
                      publishedAt: IsNull(),
                  });
        }
        newQb = this.queryOrderBy(newQb, orderBy);
        if (callback) return callback(newQb);
        return newQb;
    }

    /**
     *  对文章进行排序的Query构建
     * @param qb
     * @param orderBy 排序方式
     * 'ASC' 升序或 'DESC' 降序
     */
    protected queryOrderBy(qb: SelectQueryBuilder<PostEntity>, orderBy?: PostOrderType) {
        switch (orderBy) {
            case PostOrderType.CREATED:
                return qb.orderBy('post.createdAt', 'DESC');
            case PostOrderType.UPDATED:
                return qb.orderBy('post.updatedAt', 'DESC');
            case PostOrderType.PUBLISHED:
                return qb.orderBy('post.publishedAt', 'DESC');
            case PostOrderType.CUSTOM:
                return qb.orderBy('customOrder', 'DESC');
            default:
                return qb
                    .orderBy('post.createdAt', 'DESC')
                    .addOrderBy('post.updatedAt', 'DESC')
                    .addOrderBy('post.publishedAt', 'DESC');
        }
    }
}
