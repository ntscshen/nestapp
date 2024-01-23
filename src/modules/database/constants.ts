export const CUSTOM_REPOSITORY_METADATA = 'CUSTOM_REPOSITORY_METADATA';

/**
 * 排序方式
 * */
export enum OrderType {
    ASC = 'ASC',
    DESC = 'DESC',
}
/**
 * 树形模型在删除父级后子级的处理方式
 */
export enum TreeChildrenResolve {
    ROOT = 'root', // 在删除父节点之后，把它的子节点提升为顶级节点(挂到根节点)
    DELETE = 'delete', // 在删除父节点的同时，删除它的子(孙)节点
    UP = 'up', // 在删除父节点的同时，把它的子(孙)节点提升一级
}
