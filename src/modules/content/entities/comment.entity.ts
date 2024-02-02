import { Exclude, Expose } from 'class-transformer';
import * as typeorm from 'typeorm';

import { PostEntity } from './post.entity';

@Exclude()
@typeorm.Tree('materialized-path')
@typeorm.Entity('content_comments')
export class CommentEntity extends typeorm.BaseEntity {
    @Expose()
    @typeorm.PrimaryColumn({ type: 'varchar', generated: 'uuid', length: 36 })
    id: string;

    @Expose()
    @typeorm.Column({ type: 'text', comment: '评论内容' })
    @typeorm.Index({ fulltext: true })
    body: string;

    @Expose()
    @typeorm.CreateDateColumn({
        comment: '创建时间',
    })
    createdAt: Date;

    @Expose({ groups: ['comment-list'] })
    depth = 0;

    @Expose({ groups: ['comment-list', 'comment-detail'] })
    @typeorm.TreeParent({ onDelete: 'NO ACTION' })
    parent: typeorm.Relation<CommentEntity> | null;

    @Expose({ groups: ['comment-tree'] })
    @typeorm.TreeChildren({ cascade: true })
    children: typeorm.Relation<CommentEntity>[];

    @typeorm.ManyToOne(() => PostEntity, (post) => post.comments, {
        nullable: false, // 文章不能为空
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
    })
    post: typeorm.Relation<PostEntity>;
}
