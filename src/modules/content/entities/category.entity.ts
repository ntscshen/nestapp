import { Exclude, Expose, Type } from 'class-transformer';
import {
    BaseEntity,
    Column,
    Entity,
    OneToMany,
    PrimaryColumn,
    Relation,
    Tree,
    TreeChildren,
    TreeParent,
} from 'typeorm';

import { PostEntity } from './post.entity';

@Exclude()
@Tree('materialized-path')
@Entity('content_categories')
export class CategoryEntity extends BaseEntity {
    @Expose()
    @PrimaryColumn({ type: 'varchar', generated: 'uuid', length: 36 })
    id: string;

    @Expose()
    @Column({ comment: '分类名称' })
    name: string;

    // category-tree 直接查询这个分类树时候显示的字段
    // category-list 查询打平树并且分页后的数据时候显示的字段
    @Expose({ groups: ['category-detail', 'category-list', 'category-tree'] })
    @Column({ comment: '分类排序', default: 0 })
    customOrder: number;

    @Expose({ groups: ['category-list'] })
    depth = 0;

    @Expose({ groups: ['category-list', 'category-detail'] })
    @Type(() => CategoryEntity)
    @TreeParent({ onDelete: 'NO ACTION' })
    parent: Relation<CategoryEntity> | null;

    @Expose({ groups: ['category-tree'] })
    @Type(() => CategoryEntity)
    @TreeChildren({ cascade: true })
    children: Relation<CategoryEntity>[];

    @OneToMany(() => PostEntity, (post) => post.category, {
        cascade: true,
    })
    posts: Relation<PostEntity[]>;
}