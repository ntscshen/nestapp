// 最后增加一个 CommentEntity 用于构建评论表

import { Exclude, Expose } from 'class-transformer';
import {
    BaseEntity,
    Column,
    CreateDateColumn,
    Entity,
    ManyToOne,
    PrimaryColumn,
    Relation,
    Tree,
    TreeChildren,
    TreeParent,
} from 'typeorm';

import { PostEntity } from './post.entity';

@Exclude() // 该类中的所有属性都不会被序列化
@Tree('materialized-path')
@Entity('content_comments')
export class CommentEntity extends BaseEntity {
    @Expose()
    @PrimaryColumn({ type: 'varchar', generated: 'uuid', length: 36 })
    id: string;

    @Expose()
    @Column({ comment: '评论内容', type: 'text' })
    body: string;

    @Expose()
    @CreateDateColumn({ comment: '创建时间' })
    createdAt: Date;

    @Expose({ groups: ['comment-list'] })
    depth = 0;

    @Expose({ groups: ['comment-detail', 'comment-list'] })
    @TreeParent({ onDelete: 'CASCADE' }) // cascade 级联
    parent: Relation<CommentEntity>[];

    @Expose({ groups: ['comment-tree'] })
    @TreeChildren({ cascade: true })
    children: Relation<CommentEntity>[];

    @Expose()
    @ManyToOne(() => PostEntity, (post) => post.comment, {
        // 文章不能为空，在数据库中，当前字段必须关联到一个 Post实体，不能为null，如果试图将没有关联的 Comment保持到数据库中，将会引发错误
        nullable: true,
        // 更随父表删除与更新
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
    })
    post: Relation<PostEntity>;
}
