import { Paramtype, SetMetadata } from '@nestjs/common';

import { ClassTransformOptions } from '@nestjs/common/interfaces/external/class-transform-options.interface';
import { ValidatorOptions } from 'class-validator';

import { DTO_VALIDATION_OPTIONS } from '../constants';

// 用于配置通过全局验证管道验证数据的 DTO 类装饰器
export const DtoValidation = (
    options?: ValidatorOptions & {
        transformOptions?: ClassTransformOptions;
    } & { type?: Paramtype },
) => SetMetadata(DTO_VALIDATION_OPTIONS, options ?? {});

export * from './dto-validation.decorator';
