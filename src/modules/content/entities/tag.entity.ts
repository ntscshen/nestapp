// TagEntity 标签表
// primary   /ˈpraɪməri/   adj.主要的，初级的，基本的
// column /ˈkɒləm/  n.圆柱，列，纵队
// generated /ˈdʒenəreɪt/ v.使形成，发生
// nullable able /'eɪb(ə)l/ adj.有才干的，有本事的，能够...的 ((可为空的))

import { Exclude, Expose } from 'class-transformer';
import { Column, Entity, ManyToMany, PrimaryColumn, Relation } from 'typeorm';

import { PostEntity } from './post.entity';

/**

// exclude   /ɪkˈskluːd/   v.排除，排斥
// expose   /ɪkˈspəʊz/     v.显示，揭发，使曝光
// primary   /ˈpraɪməri/   adj.主要的，初级的，基本的
// category  /ˈkætəɡəri/   n.种类，类别

 * */

@Exclude() // 该类中的所有属性都不会被序列化
@Entity('content_tags')
export class TagEntity {
    @Expose()
    @PrimaryColumn({ type: 'varchar', generated: 'uuid', length: 36 })
    id: string;

    @Expose()
    @Column({ comment: '标签名称' })
    name: string;

    @Expose()
    @Column({ comment: '标签描述', nullable: true })
    description?: string;

    @ManyToMany(() => PostEntity, (post) => post.tags)
    posts: Relation<PostEntity[]>;

    // 通过 queryBuilder 生成的文章数量(虚拟字段)
    @Expose()
    postCount: number;
}
