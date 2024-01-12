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
    CREATED = 'createdAt',
    UPDATED = 'updatedAt',
    PUBLISHED = 'publishedAt',
    CUSTOM = 'custom',
}

/**
 * 软删除数量查询类型
 */
export enum SelectTrashMode {
    ALL = 'all', // 包含已软删除和未软删除的数据
    ONLY = 'only', // 包含软删除的数据
    NONE = 'none', // 包含未软删除的数据
}
