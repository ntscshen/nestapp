import { Entity, ManyToOne, OneToOne, Relation } from 'typeorm';

import { BaseToken } from './base.token';
import { RefreshTokenEntity } from './refresh-token.entity';
import { UserEntity } from './user.entity';

@Entity('user_access_tokens')
export class AccessTokenEntity extends BaseToken {
    // 令牌密钥和 刷新令牌密钥
    @OneToOne(() => RefreshTokenEntity, (refreshToken) => refreshToken.accessToken, {
        cascade: true,
    })
    refreshToken: Relation<RefreshTokenEntity>;

    @ManyToOne(() => UserEntity, (user) => user.accessToken, {
        onDelete: 'CASCADE',
    })
    user: Relation<UserEntity>;
}
