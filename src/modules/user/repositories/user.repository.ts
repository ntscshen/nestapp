import { BaseRepository } from '@/modules/database/base/repository';

import { UserEntity } from '../entities/user.entity';

export class UserRepository extends BaseRepository<UserEntity> {
    protected _qbName = 'user';

    buildBaseQuery() {
        return this.createQueryBuilder(this.qbName).orderBy(`${this.qbName}.createdAt`, 'DESC'); // 按照createdAt字段降序排序
    }
}
