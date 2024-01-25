import { isNil } from 'lodash';
import { ObjectLiteral, Repository, SelectQueryBuilder } from 'typeorm';

import { getOrderByQuery } from '../helpers';
import { OrderQueryType } from '../types';

// 基础存储类
export abstract class BaseRepository<E extends ObjectLiteral> extends Repository<E> {
    /**
     * 构建查询时默认的模型对应的查询名称
     */
    protected abstract _qbName: string;

    protected orderBy?: OrderQueryType;

    /**
     * 返回查询器名称
     */
    get qbName(): string {
        return this._qbName;
    }

    /**
     * 构建基础查询器
     */
    buildBaseQB(): SelectQueryBuilder<E> {
        // 在抽象类中使用 this 时，它具体指向的是继承了这个抽象类并被实例化的子类的实例。
        // 一个抽象类，它本身不能被实例化，因此 this 实际上指向的是一个继承了 BaseRepository 的子类的实例。
        return this.createQueryBuilder(this.qbName);
    }

    /**
     * 生成排序的QueryBuilder
     * @param qb
     * @param orderBy
     */
    addOrderByQuery(qb: SelectQueryBuilder<E>, orderBy?: OrderQueryType) {
        const orderByQuery = orderBy ?? this.orderBy;
        return isNil(orderByQuery) ? qb : getOrderByQuery(qb, this._qbName, orderByQuery);
    }
}
