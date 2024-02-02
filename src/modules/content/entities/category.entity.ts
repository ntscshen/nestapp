import { Exclude, Expose, Type } from 'class-transformer';
import * as typeorm from 'typeorm';

import { PostEntity } from './post.entity';

@Exclude()
@typeorm.Tree('materialized-path')
@typeorm.Entity('content_categories')
export class CategoryEntity extends typeorm.BaseEntity {
    @Expose()
    @typeorm.PrimaryColumn({ type: 'varchar', generated: 'uuid', length: 36 })
    id: string;

    @Expose()
    @typeorm.Column({ comment: '分类名称' })
    @typeorm.Index({ fulltext: true })
    name: string;

    // category-tree 直接查询这个分类树时候显示的字段
    // category-list 查询打平树并且分页后的数据时候显示的字段
    @Expose({ groups: ['category-detail', 'category-list', 'category-tree'] })
    @typeorm.Column({ comment: '分类排序', default: 0 })
    customOrder: number;

    @Expose()
    @Type(() => Date)
    @typeorm.DeleteDateColumn({ comment: '删除时间' })
    deletedAt: Date;

    @Expose({ groups: ['category-list'] })
    depth = 0;

    @Expose({ groups: ['category-list', 'category-detail'] })
    @Type(() => CategoryEntity)
    @typeorm.TreeParent({ onDelete: 'NO ACTION' })
    parent: typeorm.Relation<CategoryEntity> | null;

    @Expose({ groups: ['category-tree'] })
    @Type(() => CategoryEntity)
    @typeorm.TreeChildren({ cascade: true })
    children: typeorm.Relation<CategoryEntity>[];

    @typeorm.OneToMany(() => PostEntity, (post) => post.category, {
        cascade: true,
    })
    posts: typeorm.Relation<PostEntity[]>;
}
