import { Exclude, Expose } from 'class-transformer';
import {
    BaseEntity,
    Column,
    CreateDateColumn,
    Entity,
    JoinTable,
    ManyToMany,
    ManyToOne,
    OneToMany,
    PrimaryColumn,
    Relation,
} from 'typeorm';

import { PostBodyType } from '../constants';

import { CategoryEntity } from './category.entity';
import { CommentEntity } from './comment.entity';
import { TagEntity } from './tag.entity';

/*
Expose: n.简短的陈述，序数，报道
Expose: 是 class-transformer 库中的一个装饰器。
当你使用 class-transformer 来序列化或反序列化对象时
@Expose() 装饰器可以帮助你更精细地控制哪些属性应该包括在内

在默认情况下，所有标记为序列化的属性都将被序列化。
但是，如果你想明确地指定哪些属性应该被序列化，或想要更改属性的名称。使用@Expose

--------- --------- ---------
1. 添加了@Expose 都会使用默认的属性名进行序列化
2. 除了body外，其他字段在所有的响应中都会显示
3. body字段只在 post-detail 组的响应中显示，也就是在查询文章列表时我们不显示

*/

@Exclude()
@Entity('content_posts')
export class PostEntity extends BaseEntity {
    // @PrimaryGeneratedColumn('uuid')
    // id: string;
    // expose 显示
    // exclude 排除，排斥

    @Expose()
    @PrimaryColumn({ type: 'varchar', generated: 'uuid', length: 36 })
    id: string;

    @Expose()
    @Column({ comment: '文章标题' })
    title: string;

    @Expose({ groups: ['post-detail'] })
    @Column({ comment: '文章内容', type: 'text' })
    body: string;

    @Expose()
    @Column({ comment: '文章描述', nullable: true })
    summary?: string; // 摘要

    @Expose()
    @Column({ comment: '关键字', type: 'simple-array', nullable: true })
    keywords?: string[];

    @Expose()
    @Column({
        comment: '文章类型',
        type: 'varchar',
        default: PostBodyType.MD,
    })
    type: PostBodyType;

    @Expose()
    @Column({ comment: '发布时间', type: 'varchar', nullable: true })
    publishedAt?: Date | null; // 发布

    @Expose()
    @Column({ comment: '自定义文章排序', default: 0 })
    customOrder?: number; // 排序(0)

    @Expose()
    @CreateDateColumn({ comment: '创建时间' })
    createdAt: Date;

    @Expose()
    @CreateDateColumn({ comment: '更新时间' })
    updateAt: Date;

    // 通过 queryBuilder 生成的评论数量(虚拟字段)
    @Expose()
    commentCount: number;

    @Expose()
    @OneToMany(() => CommentEntity, (comment) => comment.post, {
        cascade: true,
    })
    comment: Relation<CommentEntity>[];

    @Expose()
    @ManyToMany(() => TagEntity, (tag) => tag.posts, {
        cascade: true,
    })
    @JoinTable()
    tags: Relation<TagEntity>[];

    @Expose()
    @ManyToOne(() => CategoryEntity, (category) => category.posts, {
        // 当前字段可以为null，也就是说一篇文章可以不属于任何分类
        nullable: true,
        // 一个级联操作，当关联的实体被删除时该如何处理
        // 如果一篇文章与某个分类管理，然后这个分类被删除了，那么这篇文章的分类将被设置为null
        onDelete: 'SET NULL',
    })
    category: Relation<CategoryEntity>;
}
