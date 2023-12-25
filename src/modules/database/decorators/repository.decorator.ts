import { SetMetadata } from '@nestjs/common';

import { ObjectType } from 'typeorm';

import { CUSTOM_REPOSITORY_METADATA } from '../constants';

export const CustomRepository = <T>(entity: ObjectType<T>): ClassDecorator => {
    return SetMetadata(CUSTOM_REPOSITORY_METADATA, entity);
};
// decorator 装饰工、油漆匠
