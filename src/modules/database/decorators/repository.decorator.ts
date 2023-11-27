// SetMetadata 是 NestJS 提供的一个装饰器工具，用于将自定义元数据与类或方法关联，
// 以便稍后在应用程序中使用这些元数据。

// 这是一个用于设置元数据的工具，通常用于存储与类、方法等相关的额外信息。
import { SetMetadata } from '@nestjs/common';

import { ObjectType } from 'typeorm';

import { CUSTOM_REPOSITORY_METADATA } from '../constants';

export const CustomRepository = <T>(entity: ObjectType<T>): ClassDecorator => {
    return SetMetadata(CUSTOM_REPOSITORY_METADATA, entity);
};
// decorator 装饰工

// 在 CustomRepository 函数内部，它调用 SetMetadata 函数，
// 将 CUSTOM_REPOSITORY_METADATA 和 entity 参数传递给它。
// 这意味着它将自定义元数据关联到装饰器所装饰的类上，以便稍后可以根据这些元数据来创建自定义 repository 类。

// 将会设置一个元数据，其键为 CUSTOM_REPOSITORY_METADATA，值为 entity。
// 当这个装饰器被应用到一个类上时，这个类将拥有这个元数据。
