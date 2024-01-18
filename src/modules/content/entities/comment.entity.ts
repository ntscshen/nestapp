import { Exclude, Expose } from 'class-transformer';
import {
    BaseEntity,
    Column,
    CreateDateColumn,
    Entity,
    Index,
    ManyToOne,
    PrimaryColumn,
    Relation,
    Tree,
    TreeChildren,
    TreeParent,
} from 'typeorm';

import { PostEntity } from './post.entity';

@Exclude()
@Tree('materialized-path')
@Entity('content_comments')
export class CommentEntity extends BaseEntity {
    @Expose()
    @PrimaryColumn({ type: 'varchar', generated: 'uuid', length: 36 })
    id: string;

    @Expose()
    @Column({ type: 'text', comment: '评论内容' })
    @Index({ fulltext: true })
    body: string;

    @Expose()
    @CreateDateColumn({
        comment: '创建时间',
    })
    createdAt: Date;

    @Expose({ groups: ['comment-list'] })
    depth = 0;

    @Expose({ groups: ['comment-list', 'comment-detail'] })
    @TreeParent({ onDelete: 'NO ACTION' })
    parent: Relation<CommentEntity> | null;

    @Expose({ groups: ['comment-tree'] })
    @TreeChildren({ cascade: true })
    children: Relation<CommentEntity>[];

    @ManyToOne(() => PostEntity, (post) => post.comments, {
        nullable: false, // 文章不能为空
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
    })
    post: Relation<PostEntity>;
}
