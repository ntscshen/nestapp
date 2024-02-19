/**
 * 文章内容类型
 */
export enum PostBodyType {
    HTML = 'html',
    MD = 'markdown',
}

/**
 * 文章排序类型
 */
export enum PostOrderType {
    /**
     * 最新创建
     */
    CREATED = 'createdAt',
    /**
     * 最近更新
     */
    UPDATED = 'updatedAt',
    /**
     * 最新发布
     */
    PUBLISHED = 'publishedAt',
    /**
     * 评论数量
     */
    COMMENTCOUNT = 'commentCount',
    /**
     * 自定义排序
     */
    CUSTOM = 'custom',
}

/**
 * 软删除数量查询类型
 */
export enum SelectTrashMode {
    /**
     * 全部数据: 包含已软删除和未软删除的数据
     */
    ALL = 'all',
    /**
     * 只查询回收站中的: 包含软删除的数据
     */
    ONLY = 'only',
    /**
     * 只查询没有被软删除的: 包含未软删除的数据
     */
    NONE = 'none',
}
