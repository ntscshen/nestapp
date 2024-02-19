// decorator: 装饰器
// depends: 依赖

import { SetMetadata, Type } from '@nestjs/common';

import { CONTROLLER_DEPENDS } from '../constants';

export const Depends = (...depends: Type<any>[]) => SetMetadata(CONTROLLER_DEPENDS, depends ?? []);
