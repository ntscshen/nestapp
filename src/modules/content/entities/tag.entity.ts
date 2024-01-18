import { Exclude, Expose, Type } from 'class-transformer';
import {
    Column,
    DeleteDateColumn,
    Entity,
    Index,
    ManyToMany,
    PrimaryColumn,
    Relation,
} from 'typeorm';

import { PostEntity } from './post.entity';

@Exclude()
@Entity('content_tags')
export class TagEntity {
    @Expose()
    @PrimaryColumn({ type: 'varchar', generated: 'uuid', length: 36 })
    id: string;

    @Expose()
    @Column({ comment: '标签名称' })
    @Index({ fulltext: true })
    name: string;

    @Expose()
    @Column({ comment: '标签描述', nullable: true })
    description?: string;

    @ManyToMany(() => PostEntity, (post) => post.tags)
    posts: Relation<PostEntity>[];

    // 通过 QueryBuilder 生成的文章数量(虚拟字段)
    @Expose()
    postCount: number;

    @Expose()
    @Type(() => Date)
    @DeleteDateColumn({ comment: '删除时间' })
    deletedAt: Date;
}
