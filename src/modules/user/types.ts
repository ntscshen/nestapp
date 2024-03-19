export interface JwtConfig {
    secret: string;
    token_expired: number; // token过期时间
    refresh_secret: string;
    refresh_token_expired: number;
}

export interface UserConfig {
    hash: number;
    jwt: JwtConfig;
}

export interface JwtPayload {
    sub: string;
    iat: number; // 签发时间
}
