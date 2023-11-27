// 这一行代码从TypeORM库中导入了Repository类，它是一个通用的仓库类，
// 用于执行与数据库表相关的操作，如查询、插入、更新和删除。
import { Repository } from 'typeorm';

// 导入了一个名为PostEntity的实体类。
// 实体类通常用于描述数据库表的结构和映射，以便在应用程序中进行对象-关系映射（ORM）。
import { CustomRepository } from '@/modules/database/decorators';

import { CommentEntity } from '../entities';
import { PostEntity } from '../entities/post.entity';

// 这意味着PostRepository将继承Repository类的所有方法和属性，
// 并专门用于处理PostEntity实体相关的数据库操作。

// 自定义的 CustomRepository 装饰器(向当前类添加元数据 PostEntity)
@CustomRepository(PostEntity)
export class PostRepository extends Repository<PostEntity> {
    // 自定义方法
    buildBaseQB() {
        // 创建一个新的查询创建器，用于创建 SQL 查询。
        // createQueryBuilder方法用于创建一个新的查询构建器实例。
        // 查询构建器提供了一种以编程方式构建SQL查询的方式。这里创建了一个查询构建器，
        // 并使用别名"post"表示 Post 实体。
        return this.createQueryBuilder('post')
            .leftJoinAndSelect('post.category', 'category')
            .leftJoinAndSelect('post.tags', 'tags')
            .addSelect((subQuery) => {
                return subQuery
                    .select('COUNT(c.id)', 'count')
                    .from(CommentEntity, 'c')
                    .where('c.post.id = post.id');
            }, 'commentCount')
            .loadRelationCountAndMap('post.commentCount', 'post.comment');

        // 在查询之前先查询出评论数量在添加到 commentCount 字段上
        // “对于每个帖子，我想知道有多少评论与它相关。”
        // 这样，在最终的查询结果中，我们不仅可以看到每个帖子的信息，还可以看到与之相关的评论数量。
        // }, 'commentCount') 子查询结束，并将结果命名为 commentCount ，这样我们可以在结果集中访问这个计算出来的评论数量。

        // .loadRelationCountAndMap('post.commentCount', 'post.comment');
        // 我想加载与post实体相关联的commentCount，并将这个数量映射到post.comments上。

        // 自定义的 PostRepository，其中包含了一个 buildBaseQB 方法用于构建一个复杂的查询，
        // 该查询连接了与帖子相关的分类、标签，并计算了与每个帖子相关的评论的数量。
    }
}

// entities(描述数据库表的结构和映射)
// service(业务逻辑) -> repositories(数据访问)
// 为什么可以使用自定义的 repository?
// 1. 全局定义了 DatabaseModule.forRepository -> provider
//    核心功能: 将每个添加了 自定义装饰器(CustomRepository) 和其自定义的方法
//    都改写成provider(供应者)， 让导入的当前模块可以使用 (e.g. PostRepository)
// 2. 在 service 中首先 constructor(protected repository: PostRepository)
//    PostRepository 是注册的自定义的 Repository
