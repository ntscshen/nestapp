import { Injectable } from '@nestjs/common';
import { isArray, isFunction, isNil, omit } from 'lodash';
import { EntityNotFoundError, In, IsNull, Not, SelectQueryBuilder } from 'typeorm';

import { paginate } from '@/modules/database/helpers';
import { QueryHook } from '@/modules/database/types';

import { PostOrderType, SelectTrashMode } from '../constants';
import { CreatePostDto, UpdatePostDto } from '../dtos';
import { PaginateDto } from '../dtos/paginate.dto';
import { PostEntity } from '../entities/post.entity';
import { CategoryRepository, PostRepository, TagRepository } from '../entities/repositories';

import { SearchType } from '../types';

import { CategoryService } from './category.service';

// src/modules/content/services/post.service.ts
@Injectable()
export class PostService {
    constructor(
        protected postRepository: PostRepository,
        protected categoryRepository: CategoryRepository,
        protected categoryService: CategoryService,
        protected tagRepository: TagRepository,
        protected search_type: SearchType = 'against',
    ) {}

    /**
     * 查询单篇文章
     * @param id
     * @param callback 添加额外的查询
     */
    async detail(id: string, callback?: QueryHook<PostEntity>) {
        let qb = this.postRepository.createQueryBuilder('post');
        qb.where(`post.id = :id`, { id });
        qb = !isNil(callback) && isFunction(callback) ? await callback(qb) : qb;
        const item = await qb.getOne();
        if (!item) throw new EntityNotFoundError(PostEntity, `The post ${id} not exists!`);
        return item;
    }

    /**
     * 创建文章
     * @param data
     */
    async create(data: CreatePostDto) {
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
        const item = await this.postRepository.save(createPostDto);

        return this.detail(item.id);
    }

    /**
     * 删除文章
     * @param id
     */
    async delete(ids: string[], trash?: boolean) {
        const items = await this.postRepository.find({
            where: { id: In(ids) },
            withDeleted: true,
        });
        if (trash) {
            const softs = items.filter((item) => isNil(item.deletedAt)); // 没被软删除的
            const directs = items.filter((item) => !isNil(item.deletedAt)); // 已经被软删除的
            return [
                ...(await this.postRepository.remove(directs)),
                ...(await this.postRepository.softRemove(softs)),
            ];
        }
        return this.postRepository.remove(items);
    }

    /**
     * 恢复文章
     * @param ids
     * */
    async restore(ids: string[]) {
        const items = await this.postRepository.find({
            where: { id: In(ids) } as any,
            withDeleted: true,
        });
        const trasheds = items.filter((item) => !isNil(item.deletedAt)).map((item) => item.id);
        if (trasheds.length < 1) return [];
        await this.postRepository.restore(trasheds);
        const qb = await this.buildListQuery(
            this.postRepository.buildBaseQB(),
            {},
            async (qbuilder) => {
                return qbuilder.andWhereInIds(trasheds);
            },
        );
        return qb.getMany();
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
            this.postRepository.save(post, { reload: true });
        }

        if (isArray(data.tags)) {
            // 更新文章关联标签
            await this.postRepository
                .createQueryBuilder('post')
                .relation(PostEntity, 'tags')
                .of(post)
                .addAndRemove(data.tags, post.tags ?? []);
        }
        await this.postRepository.update(data.id, omit(data, ['id', 'tags', 'category']));
        return this.detail(data.id);
    }

    /**
     * 获取分页数据
     * @param options 分页选项
     * @param callback 添加额外的查询
     */
    async paginate(options: PaginateDto, callback?: QueryHook<PostEntity>) {
        // const queryBuilder = this.postRepository.createQueryBuilder('post');
        const queryBuilder = this.postRepository.buildBaseQB();
        const qb = await this.buildListQuery(queryBuilder, options, callback);
        return paginate(qb, options); // 这里的paginate是一个工具方法
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
        const { category, tag, orderBy, isPublished, trashed = SelectTrashMode.NONE } = options;
        let newQb = qb;
        if (trashed === SelectTrashMode.ALL || trashed === SelectTrashMode.ONLY) {
            newQb = newQb.withDeleted();
            if (trashed === SelectTrashMode.ONLY) {
                newQb = newQb.where({
                    deletedAt: Not(IsNull()),
                });
            }
        }
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

        if (category) await this.queryByCategory(category, qb); // 在查询结果中，如果有分类，查询出其后代分类
        if (!isNil(options.search)) this.buildSearchQuery(qb, options.search);
        // 查询某个标签关联的文章
        if (tag) qb.where('tags.id = :id', { id: tag }); // 在查询结果中，如果有标签，查询出其后代标签

        if (callback) return callback(newQb);
        return newQb;
    }

    protected async buildSearchQuery(qb: SelectQueryBuilder<PostEntity>, search: string) {
        console.log('search_type :>> ', this.search_type);
        console.log('search :>> ', search);
        if (this.search_type === 'like') {
            qb.andWhere('title LIKE :search', { search: `%${search}%` })
                .orWhere('body LIKE :search', { search: `%${search}%` })
                .orWhere('summary LIKE :search', { search: `%${search}%` })
                .orWhere('category.name LIKE :search', {
                    search: `%${search}%`,
                })
                .orWhere('tags.name LIKE :search', {
                    search: `%${search}%`,
                });
        } else if (this.search_type === 'against') {
            console.log('search112233 :>> ', {
                search: `${search}*`,
            });
            qb.andWhere('MATCH(title) AGAINST (:search IN BOOLEAN MODE)', {
                search: `${search}*`,
            })
                .orWhere('MATCH(body) AGAINST (:search IN BOOLEAN MODE)', {
                    search: `${search}*`,
                })
                .orWhere('MATCH(summary) AGAINST (:search IN BOOLEAN MODE)', {
                    search: `${search}*`,
                })
                .orWhere('MATCH(category.name) AGAINST (:search IN BOOLEAN MODE)', {
                    search: `${search}*`,
                })
                .orWhere('MATCH(tags.name) AGAINST (:search IN BOOLEAN MODE)', {
                    search: `${search}*`,
                });
        }
        return qb;
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

    /**
     * 查询出分类及其后代分类下的所有文章的Query构建
     * @param id
     * @param qb
     */
    protected async queryByCategory(id: string, qb: SelectQueryBuilder<PostEntity>) {
        const root = await this.categoryService.detail(id);
        const tree = await this.categoryRepository.findDescendantsTree(root);
        const flatDes = await this.categoryRepository.toFlatTrees(tree.children);
        const ids = [tree.id, ...flatDes.map((item) => item.id)];
        return qb.where('category.id IN (:...ids)', {
            ids,
        });
    }
}
