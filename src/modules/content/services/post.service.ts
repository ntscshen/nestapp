import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { isArray, isFunction, isNil, omit } from 'lodash';
import {
    DataSource,
    EntityNotFoundError,
    In,
    IsNull,
    Not,
    Repository,
    SelectQueryBuilder,
} from 'typeorm';

import { paginate } from '@/modules/database/helpers';
import { QueryHook } from '@/modules/database/types';

import { PostOrderType } from '../constants';
import { CreatePostDto, UpdatePostDto } from '../dtos';
import { PaginateDto } from '../dtos/paginate.dto';
import { PostEntity } from '../entities/post.entity';
import { CategoryRepository, PostRepository, TagRepository } from '../entities/repositories';

// src/modules/content/services/post.service.ts
@Injectable()
export class PostService {
    constructor(
        @InjectRepository(PostEntity)
        protected repository: Repository<PostEntity>,
        protected categoryRepository: CategoryRepository,
        protected tagRepository: TagRepository,

        private datasource: DataSource,
        private postRepository: PostRepository,
    ) {}

    /**
     * 创建文章
    //  * @param data
     */
    async create(data: CreatePostDto) {
        // dto中category字段是 string
        // 但是在Entity中定义的category是一个CategoryEntity实体
        // 所以当你想要将值传递到CategoryEntity类型中时，需要将值转换为entity类型
        const createPostDto = {
            ...data,
            // 文章所属的分类
            category: !isNil(data.category)
                ? await this.categoryRepository.findOneOrFail({ where: { id: data.category } })
                : null,
            // 文章关联的标签
            tags: isArray(data.tags)
                ? await this.tagRepository.findBy({
                      id: In(data.tags),
                  })
                : [],
            //  PostEntity 中被定义为允许 null 值。
        };
        const item = await this.repository.save(createPostDto);

        return this.detail(item.id);
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
     * 更新文章
     * @param data
     */
    async update(data: UpdatePostDto) {
        const post = await this.detail(data.id);
        if (data.category !== undefined) {
            // 更新分类
            const category = isNil(data.category)
                ? null
                : await this.categoryRepository.findOneByOrFail({ id: data.category });
            post.category = category;
            this.repository.save(post, { reload: true });
        }

        if (isArray(data.tags)) {
            // 更新文章关联标签
            await this.repository
                .createQueryBuilder('post')
                .relation(PostEntity, 'tags')
                .of(post)
                .addAndRemove(data.tags, post.tags ?? []);
        }
        await this.repository.update(data.id, omit(data, ['id', 'tags', 'category']));
        return this.detail(data.id);
    }

    /**
     * 获取分页数据
     * @param options 分页选项
     * @param callback 添加额外的查询
     */
    async paginate(options: PaginateDto, callback?: QueryHook<PostEntity>) {
        const queryBuilder = this.postRepository.createQueryBuilder('post');
        // const post = await this.postRepository.findOne({
        //     where: { id: '7b1a6bd3-e5e4-4786-876c-731ebcec55e3' },
        // });
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
        return item;
        // const result = await this.repository.findOneBy({ id });
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
