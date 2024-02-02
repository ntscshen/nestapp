import { Exclude, Expose, Type } from 'class-transformer';
import * as typeorm from 'typeorm';

import { PostBodyType } from '../constants';

import { CategoryEntity } from './category.entity';
import { CommentEntity } from './comment.entity';
import { TagEntity } from './tag.entity';

@Exclude()
@typeorm.Entity('content_posts')
export class PostEntity extends typeorm.BaseEntity {
    @Expose()
    @typeorm.PrimaryColumn({ type: 'varchar', generated: 'uuid', length: 36 })
    id: string;

    @Expose()
    @typeorm.Column({ comment: '文章标题' })
    @typeorm.Index({ fulltext: true })
    title: string;

    @Expose({ groups: ['post-detail'] })
    @typeorm.Column({ comment: '文章内容', type: 'text' })
    @typeorm.Index({ fulltext: true })
    body: string;

    @Expose()
    @typeorm.Column({ comment: '文章描述', nullable: true })
    @typeorm.Index({ fulltext: true })
    summary?: string;

    @Expose()
    @typeorm.Column({ comment: '关键字', type: 'simple-array', nullable: true })
    keywords?: string[];

    @Expose()
    @typeorm.Column({
        comment: '文章类型',
        type: 'varchar',
        // 如果是mysql或者postgresql你可以使用enum类型
        // enum: PostBodyType,
        default: PostBodyType.MD,
    })
    type: PostBodyType;

    @Expose()
    @typeorm.Column({
        comment: '发布时间',
        type: 'varchar',
        nullable: true,
    })
    publishedAt?: Date | null;

    @Expose()
    @typeorm.Column({ comment: '自定义文章排序', default: 0 })
    customOrder: number;

    @Expose()
    @typeorm.CreateDateColumn({
        comment: '创建时间',
    })
    createdAt: Date;

    @Expose()
    @typeorm.UpdateDateColumn({
        comment: '更新时间',
    })
    updatedAt: Date;

    @Expose()
    @Type(() => Date)
    @typeorm.DeleteDateColumn({
        // 每次软删除对象时，改日期都会更新(设置deletedAt为当前时间)
        // 该值为 null 时，表示没有被删除， 该值为一个时间时，则处于软删除状态
        comment: '删除时间',
    })
    deletedAt: Date;

    @Expose()
    @typeorm.ManyToOne(() => CategoryEntity, (category) => category.posts, {
        nullable: true,
        onDelete: 'SET NULL', // 当前实体为项目主体内容，当one端被删除时，当前的关联实体应该被设置为NULL，而不是在数据库中被级联删除
    })
    category: typeorm.Relation<CategoryEntity>;

    @Expose()
    @typeorm.ManyToMany(() => TagEntity, (tag) => tag.posts, {
        cascade: true,
    })
    @typeorm.JoinTable()
    tags: typeorm.Relation<TagEntity>[];

    @Expose()
    @typeorm.OneToMany(() => CommentEntity, (comment) => comment.post, {
        cascade: true,
    })
    comments: typeorm.Relation<CommentEntity>[];
}
