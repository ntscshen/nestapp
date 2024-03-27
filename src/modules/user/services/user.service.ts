import { Injectable } from '@nestjs/common';

import { DataSource, EntityNotFoundError, SelectQueryBuilder } from 'typeorm';

import { Configure } from '@/modules/config/configure';
import { BaseService } from '@/modules/database/base/service';

import { QueryHook } from '@/modules/database/types';

import { CreateUserDto, QueryUserDto, UpdateUserDto } from '../dtos/user.dto';
import { UserEntity } from '../entities/user.entity';
import { UserRepository } from '../repositories/user.repository';

@Injectable()
export class UserService extends BaseService<UserEntity, UserRepository> {
    protected enable_trash = true;

    constructor(
        protected configure: Configure,
        protected dataSource: DataSource,
        protected userRepository: UserRepository,
    ) {
        super(userRepository);
    }

    async create(data: CreateUserDto) {
        const user = await this.userRepository.save(data, { reload: true });
        return this.detail(user.id);
    }

    async update(data: UpdateUserDto) {
        const user = await this.userRepository.save(data, { reload: true });
        return this.detail(user.id);
    }

    protected async buildListQB(
        queryBuilder: SelectQueryBuilder<UserEntity>,
        options: QueryUserDto,
        callback?: QueryHook<UserEntity>,
    ): Promise<SelectQueryBuilder<UserEntity>> {
        const { orderBy } = options;
        const qb = await super.buildListQB(queryBuilder, options, callback);
        if (orderBy) qb.orderBy(`user.${orderBy}`, 'ASC');
        return qb;
    }

    /**
     * 用户可以使用他们的用户名、邮箱或电话号码之一作为身份识别凭证
     * credential string 用户提供的登录凭证，可以是用户名、邮箱或电话号码。
     * callback 回调函数，允许对查询进行额外的定制或修改。
     * */
    async findOneByCredential(credential: string, callback?: QueryHook<UserEntity>) {
        let query = this.userRepository.buildBaseQuery();
        if (callback) {
            query = await callback(query);
        }
        return query
            .where('user.username = :credential', { credential })
            .orWhere('user.email = :credential', { credential })
            .orWhere('user.phone = :credential', { credential })
            .getOne();
    }

    async findOneByCondition(condition: { [key: string]: any }, callback?: QueryHook<UserEntity>) {
        let query = this.userRepository.buildBaseQuery();
        if (callback) {
            query = await callback(query);
        }
        const wheres = Object.fromEntries(
            Object.entries(condition).map(([key, value]) => [key, value]),
        );
        const user = query.where(wheres).getOne();
        if (!user) {
            throw new EntityNotFoundError(UserEntity, Object.keys(condition).join(','));
        }
        return user;
    }
}
