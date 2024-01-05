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
    UpdateDateColumn,
} from 'typeorm';

import { PostBodyType } from '../constants';

import { CategoryEntity } from './category.entity';
import { CommentEntity } from './comment.entity';
import { TagEntity } from './tag.entity';

@Exclude()
@Entity('content_posts')
export class PostEntity extends BaseEntity {
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
    summary?: string;

    @Expose()
    @Column({ comment: '关键字', type: 'simple-array', nullable: true })
    keywords?: string[];

    @Expose()
    @Column({
        comment: '文章类型',
        type: 'varchar',
        // 如果是mysql或者postgresql你可以使用enum类型
        // enum: PostBodyType,
        default: PostBodyType.MD,
    })
    type: PostBodyType;

    @Expose()
    @Column({
        comment: '发布时间',
        type: 'varchar',
        nullable: true,
    })
    publishedAt?: Date | null;

    @Expose()
    @Column({ comment: '自定义文章排序', default: 0 })
    customOrder: number;

    @Expose()
    @CreateDateColumn({
        comment: '创建时间',
    })
    createdAt: Date;

    @Expose()
    @UpdateDateColumn({
        comment: '更新时间',
    })
    updatedAt: Date;

    @Expose()
    @ManyToOne(() => CategoryEntity, (category) => category.posts, {
        nullable: true,
        onDelete: 'SET NULL', // 当前实体为项目主体内容，当one端被删除时，当前的关联实体应该被设置为NULL，而不是在数据库中被级联删除
    })
    category: Relation<CategoryEntity>;

    @Expose()
    @OneToMany(() => CommentEntity, (comment) => comment.post, {
        cascade: true,
    })
    comments: Relation<CommentEntity>[];

    @Expose()
    @ManyToMany(() => TagEntity, (tag) => tag.posts, {
        cascade: true,
    })
    @JoinTable({
        // name: 'content_posts_tags',
        // joinColumn: {
        //     name: 'postId',
        //     referencedColumnName: 'id',
        // },
        // inverseJoinColumn: {
        //     name: 'tagId',
        //     referencedColumnName: 'id',
        // },
    })
    tags: Relation<TagEntity>[];
}
