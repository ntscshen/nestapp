// category n.种类，类别
// 首先我们添加 CategoryEntity 来构建分类表
// primary   /ˈpraɪməri/   adj.主要的，初级的，基本的
// column /ˈkɒləm/  n.圆柱，列，纵队
// generated /ˈdʒenəreɪt/ v.使形成，发生
// custom /ˈkʌstəm/ n.风俗，习惯 adj.定制的，定做的
// order /ˈɔːdə(r)/ n.命令，顺序

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

// 1. @Tree('materialized-path')

import { PostEntity } from './post.entity';

// 使用class-transformer 进行对象序列化(将对象转换为JSON)
// @Exclude()可以用来标记某个属性，使其在序列化时被排除
// 这意味着，当你尝试将实体类转换为JSON时，被 @Exclude()标记的属性不会被包含在生成的JSON中
@Exclude()
// 这个实体类应该被视为一个使用"物化路径"策略的树状结构。这意味着这个实体具有树状的层次结构
// 并使用物化路径的方式来存储和检索节点
@Tree('materialized-path')
@Entity('content_categories')
export class CategoryEntity extends BaseEntity {
    @Expose()
    @PrimaryColumn({ type: 'varchar', generated: 'uuid', length: 36 })
    id: string;

    @Expose()
    @Column({ comment: '分类名称' })
    name: string;

    @Expose({ groups: ['category-tree', 'category-list', 'category-detail'] })
    @Column({ comment: '分类排序', default: 0 })
    customOrder: number;

    @Expose({ groups: ['category-list'] })
    depth = 0;

    @Expose({ groups: ['category-detail', 'category-list'] })
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
