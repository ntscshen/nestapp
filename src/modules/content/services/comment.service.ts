import { ForbiddenException, Injectable } from '@nestjs/common';

import { isNil } from 'lodash';

import { EntityNotFoundError, SelectQueryBuilder } from 'typeorm';

import { treePaginate } from '@/modules/database/helpers';

import { CreateCommentDto, QueryCommentDto, QueryCommentTreeDto } from '../dtos';
import { CommentEntity } from '../entities';
import { CommentRepository, PostRepository } from '../entities/repositories';

@Injectable()
export class CommentService {
    constructor(
        protected repository: CommentRepository,
        protected postRepository: PostRepository,
    ) {}

    // 增删改查
    /**
     * 新增评论
     * @param data
     * @param user
     */
    async create(data: CreateCommentDto) {
        const parent = await this.getParent(undefined, data.parent);
        // 不为空 & 父评论和子评论必须属于同一个帖子
        if (!isNil(parent) && parent?.post.id !== data.post) {
            throw new ForbiddenException('Parent comment and child comment must belong same post!');
        }
        const item = await this.repository.save({
            ...data,
            parent,
            post: await this.getPost(data.post), // 查找相关post内容，data.post外键 一般指向postEntity的id主键
        });
        return this.repository.findOneOrFail({ where: { id: item.id } });
    }

    /**
     * 删除评论
     * @param id
     */
    async delete(id: string) {
        const comment = await this.repository.findOneOrFail({ where: { id: id ?? null } });
        return this.repository.remove(comment);
    }

    /**
     * 直接查询评论树
     * @param options
     */
    async findTrees(options: QueryCommentTreeDto = {}) {
        return this.repository.findTrees({
            addQuery: (qb) => {
                // 查询回调增强
                return isNil(options.post) ? qb : qb.where('post.id = :id', { id: options.post });
            },
        });
    }

    /**
     * 查找一篇文章的评论并分页
     * @param dto
     */
    async paginate(dto: QueryCommentDto) {
        const { post, ...query } = dto;
        const addQuery = (qb: SelectQueryBuilder<CommentEntity>) => {
            const condition: Record<string, string> = {};
            if (!isNil(post)) condition.post = post;
            return Object.keys(condition).length > 0 ? qb.andWhere(condition) : qb;
        };
        const data = await this.repository.findRoots({
            addQuery,
        });
        let comments: CommentEntity[] = [];
        for (let i = 0; i < data.length; i++) {
            const c = data[i];
            comments.push(
                await this.repository.findDescendantsTree(c, {
                    addQuery,
                }),
            );
        }
        comments = await this.repository.toFlatTrees(comments);
        return treePaginate(query, comments);
    }

    /**
     * 获取评论所属文章实例
     * @param id
     */
    protected async getPost(id: string) {
        return !isNil(id) ? this.postRepository.findOneOrFail({ where: { id } }) : id;
    }

    /**
     * 获取请求传入的父分类
     * @param current 当前分类的ID
     * @param id
     */
    protected async getParent(
        current?: string,
        parentId?: string,
    ): Promise<CommentEntity | null | undefined> {
        console.log('current :>> ', current);
        console.log('parentId :>> ', parentId);
        console.log('current === parentId :>> ', current === parentId);
        if (current === parentId) return undefined; // 防止循环引用
        if (parentId === null || parentId === undefined) return null; // 未定义时返回null

        // 参数有效性检查 this.isValidId(parentId); 看后续情况添加

        return this.findParentComment(parentId);
    }

    private async findParentComment(parentId: string): Promise<CommentEntity | null> {
        const parent = await this.repository.findOne({
            where: { id: parentId },
            relations: ['parent', 'post'],
        });

        if (parent) return parent;

        throw new EntityNotFoundError(CommentEntity, `Parent category ${parentId} not exists!`);
    }
}
