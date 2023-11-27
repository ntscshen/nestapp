import { Injectable } from '@nestjs/common';

import { isArray, isFunction, isNil, omit } from 'lodash';
import { EntityNotFoundError, In, IsNull, Not, SelectQueryBuilder } from 'typeorm';

// 引用实体
import { paginate } from '@/modules/database/helper';
import { QueryHook } from '@/modules/database/types';

import { PostOrderType } from '../constants';
import { CreatePostDto, QueryPostDto, UpdatePostDto } from '../dots/post.dto';
import { PostEntity } from '../entities/post.entity';
import { CategoryRepository, PostRepository, TagRepository } from '../repositories';

import { CategoryService } from './category.service';

// 文章查询接口
type FindParams = {
    [key in keyof Omit<QueryPostDto, 'limit' | 'page'>]: QueryPostDto[key];
};

@Injectable()
export class PostService {
    constructor(
        protected repository: PostRepository,
        protected tagRepository: TagRepository,
        protected categoryService: CategoryService,
        protected categoryRepository: CategoryRepository,
    ) {}

    // 创建文章
    // 有了 DTO 之后不代表就可以自动对请求数据进行验证了
    // 1. 我们需要把 DTO 作为类型提示添加到API端点的参数上(即控制器的方法上)
    // 2. 然后在 Query、Body 等装饰器上加 ValidationPipe 管道才能对请求数据进行验证
    async create(data: CreatePostDto) {
        const createPostDto = {
            ...data,
            category: !isNil(data.category)
                ? await this.categoryRepository.findOneOrFail({ where: { id: data.category } })
                : null,
            // 文章关联的标签
            tags: isArray(data.tags)
                ? await this.tagRepository.findBy({
                      id: In(data.tags),
                  })
                : [],
        };
        const item = await this.repository.save(createPostDto);
        return this.detail(item.id);
    }

    // 删除文章
    async delete(id: string) {
        // 查找符合给定 where 条件的第一个实体，如果在数据库中找不到实体，则会出错误
        const item = await this.repository.findOneByOrFail({ id });
        // 从数据库中删除实体
        return this.repository.remove(item);
    }

    // 更新文章
    // async update(data: Record<string, any>) {
    async update(data: UpdatePostDto) {
        // const post = await this.detail(data.id);
        // if (data.category !== undefined) {
        //     // 更新分类
        //     const category = isNil(data.category)
        //         ? null
        //         : await this.categoryRepository.findOneByOrFail({ id: data.category });
        //     post.category = category;
        //     this.repository.save(post, { reload: true });
        // }
        // if (isArray(data.tags)) {
        //     // 更新文章关联标签
        //     await this.repository
        //         .createQueryBuilder('post')
        //         .relation(PostEntity, 'tags')
        //         .of(post)
        //         .addAndRemove(data.tags, post.tags ?? []);
        // }
        await this.repository.update(data.id, omit(data, ['id', 'tags', 'category']));
        return this.detail(data.id);
    }

    // 查询单篇文章
    async detail(id: string, callback?: QueryHook<PostEntity>) {
        let qb = this.repository.buildBaseQB();

        qb.where(`post.id = :id`, { id });

        qb = !isNil(callback) && isFunction(callback) ? await callback(qb) : qb;
        // qb.getOne() 获取通过执行生成的查询生成器 SQL 返回的单个实体
        // 从查询结果中获取一条记录
        const item = await qb.getOne();

        if (!item) throw new EntityNotFoundError(PostEntity, `The post ${id} not exists!`);
        return item;
    }

    /**
     * 获取分页数据
     * @param options 分页选项
     * @param callback 添加额外的查询
     */
    async paginate(options: QueryPostDto, callback?: QueryHook<PostEntity>) {
        // const qb = await this.buildListQuery(this.repository.buildBaseQB(), options, callback);
        const qb = this.repository.buildBaseQB();
        return paginate(qb, options);
    }

    /**
     * 构建文章列表查询器
     * @param qb 初始查询构造器
     * @param options 排查分页选项后的查询选项
     * @param callback 添加额外的查询
     */
    protected async buildListQuery(
        qb: SelectQueryBuilder<PostEntity>,
        options: FindParams,
        callback?: QueryHook<PostEntity>,
    ) {
        const { category, tag, orderBy, isPublished } = options;
        if (typeof isPublished === 'boolean') {
            isPublished
                ? qb.where({
                      publishedAt: Not(IsNull()),
                  })
                : qb.where({
                      publishedAt: IsNull(),
                  });
        }

        this.queryOrderBy(qb, orderBy);
        if (category) await this.queryByCategory(category, qb);
        // 查询某个标签关联的文章
        if (tag) qb.where('tags.id = :id', { id: tag });
        if (callback) return callback(qb);
        return qb;
    }

    /**
     *  对文章进行排序的Query构建
     * @param qb
     * @param orderBy 排序方式
     */
    protected queryOrderBy(qb: SelectQueryBuilder<PostEntity>, orderBy?: PostOrderType) {
        switch (orderBy) {
            case PostOrderType.CREATED:
                return qb.orderBy('post.createdAt', 'DESC');
            case PostOrderType.UPDATED:
                return qb.orderBy('post.updatedAt', 'DESC');
            case PostOrderType.PUBLISHED:
                return qb.orderBy('post.publishedAt', 'DESC');
            case PostOrderType.COMMENTCOUNT:
                return qb.orderBy('commentCount', 'DESC');
            case PostOrderType.CUSTOM:
                return qb.orderBy('customOrder', 'DESC');
            default:
                return qb
                    .orderBy('post.createdAt', 'DESC')
                    .addOrderBy('post.updatedAt', 'DESC')
                    .addOrderBy('post.publishedAt', 'DESC')
                    .addOrderBy('commentCount', 'DESC');
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
