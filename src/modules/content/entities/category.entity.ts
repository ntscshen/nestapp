import { BaseEntity, Column, Entity, OneToMany, PrimaryColumn, Relation } from 'typeorm';

import { PostEntity } from './post.entity';

@Entity('content_categories')
export class CategoryEntity extends BaseEntity {
    @PrimaryColumn({ type: 'varchar', generated: 'uuid', length: 36 })
    id: string;

    @Column({ comment: '分类名称' })
    name: string;

    @Column({ comment: '分类排序', default: 0 })
    customOrder: number;

    @OneToMany(() => PostEntity, (post) => post.category, {
        cascade: true,
    })
    posts: Relation<PostEntity>;
}
