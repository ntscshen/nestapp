import { Exclude, Expose, Type } from 'class-transformer';
import {
    Column,
    CreateDateColumn,
    DeleteDateColumn,
    Entity,
    OneToMany,
    PrimaryColumn,
    Relation,
    UpdateDateColumn,
} from 'typeorm';

import { CommentEntity, PostEntity } from '@/modules/content/entities';

@Exclude() // 序列化包含或排除
@Entity('user')
export class UserEntity {
    @PrimaryColumn({ type: 'varchar', generated: 'uuid', length: 36 })
    id: string;

    @Expose()
    @Column({
        comment: '姓名',
        nullable: true, // 是否可以为 NULL
    })
    nickname?: string;

    @Expose()
    @Column({ comment: '用户名', unique: true }) // 该字段的值在整个表中必须是唯一的
    username: string;

    @Expose()
    // select 当通过 TypeORM 查询数据时，该字段是否默认被选中（即返回）
    @Column({ comment: '密码', length: 500, select: false })
    password: string;

    @Expose()
    @Column({ comment: '手机号', nullable: true, unique: true })
    phone?: string;

    @Expose()
    @Column({ comment: '邮箱', nullable: true, unique: true })
    email?: string;

    @Expose()
    @Type(() => Date)
    @CreateDateColumn({
        comment: '创建时间',
    })
    createdAt: Date;

    @Expose()
    @Type(() => Date)
    @UpdateDateColumn({
        comment: '用户更新时间',
    })
    updatedAt: Date;

    @Expose()
    @Type(() => Date)
    @DeleteDateColumn({
        comment: '用户删除时间',
    })
    deletedAt: Date;

    @OneToMany(() => PostEntity, (post) => post.author, {
        cascade: true, // 级联删除，引用该实体的多端实体也被删除
    })
    posts: Relation<PostEntity>[];

    @OneToMany(() => CommentEntity, (comment) => comment.author, {
        cascade: true,
    })
    comments: Relation<CommentEntity>[];
}
