import {
    ArgumentMetadata,
    BadRequestException,
    Injectable,
    Paramtype,
    ValidationPipe,
} from '@nestjs/common';

import { isObject, omit } from 'lodash';

import { DTO_VALIDATION_OPTIONS } from '../constants';
import { deepMerge } from '../helpers';

/**
 * 全局管道,用于处理DTO验证
 * AppPipe 是一个全局管道，用于处理 DTO(数据传输对象) 的验证。确保进入应用程序的数据是有效和预期的。
 * --------- 创建一个全局验证管道类 ---------
 * --------- 创建一个全局验证管道类 ---------
 * --------- 创建一个全局验证管道类 ---------
 */
@Injectable()
export class AppPipe extends ValidationPipe {
    async transform(value: any, metadata: ArgumentMetadata) {
        console.log('🚀 ~ file: app.pipe.ts:24 ~ AppPipe ~ transform ~ value:', value);
        console.log('metadata :>> ', metadata);

        // 这个type是实时的，根据controller 的"参数装饰器"
        const { metatype, type } = metadata;
        console.log('metatype :>> ', metatype);
        console.log('metatype :>> ', typeof metatype);
        console.log('type :>> ', type);
        // 获取要验证的dto类
        const dto = metatype as any;
        // 获取dto类的装饰器元数据中的自定义验证选项
        const options = Reflect.getMetadata(DTO_VALIDATION_OPTIONS, dto) || {};
        console.log(
            '🚀 ~ file: app.pipe.ts:32 ~ AppPipe ~ transform ~ options: --- 元数据, metadata',
            options,
        );

        // 把当前已设置的选项解构到备份对象
        const originOptions = { ...this.validatorOptions };
        // 把当前已设置的class-transform选项解构到备份对象
        const originTransform = { ...this.transformOptions };
        // 把自定义的class-transform和type选项解构出来
        // ClassTransformOptions 转换过程中要传递的对象 有这个字段信息
        const { transformOptions, type: optionsType, ...customOptions } = options;
        // 根据DTO类上设置的type来设置当前的DTO请求类型,默认为'body'
        // 如果左侧的表达式是 null 或 undefined，那么它就会返回其右侧的表达式

        // @DtoValidation() 如果不添加 type 类型，默认是undefiend 会默认为body
        //
        const requestType: Paramtype = optionsType ?? 'body';
        // 创建、更新、默认什么都不传递 都是body

        // 如果被验证的DTO设置的请求类型与被验证的数据的请求类型不是同一种类型则跳过此管道
        // 意思是: controller 中用的参数装饰器和自己定义的@DtoValidation()中的type类型不一致
        // 就直接跳过此管道，当做不存在
        if (requestType !== type) return value;

        console.log('transformOptions :>> ', transformOptions);
        // 合并当前transform选项和自定义选项
        // ClassTransformOptions: 转换过程中要传递的选项
        if (transformOptions) {
            this.transformOptions = deepMerge(
                this.transformOptions,
                transformOptions ?? {},
                'replace',
            ) as any;
        }
        // 合并当前验证选项和自定义选项
        this.validatorOptions = deepMerge(
            this.validatorOptions,
            customOptions ?? {},
            'replace',
        ) as any;

        // 循环原数据，判断是一个对象且不是一个文件。就过滤掉fields字段
        // 如果输入值是一个对象，那么对这个对象的每个属性进行检查和处理；
        // 如果属性的值也是一个包含 'mimetype' 属性的对象，就移除这个属性值对象中的 'fields' 属性；
        // 如果输入值不是一个对象，直接返回这个值。这样的处理通常用于清理或准备数据
        const toValidate = isObject(value)
            ? Object.fromEntries(
                  Object.entries(value as Record<string, any>).map(([key, v]) => {
                      if (!isObject(v) || !('mimetype' in v)) return [key, v];
                      return [key, omit(v, ['fields'])];
                  }),
              )
            : value;
        try {
            // 序列化并验证dto对象
            // toValidate原始数据(过滤掉fields)
            // 通过super.transform()将entity中的其他值添加进去
            // 序列化 - 并 - 验证dto对象
            let result = await super.transform(toValidate, metadata);
            console.log(
                '🚀 ~ file: app.pipe.ts:93 ~ AppPipe ~ transform ~ toValidate:',
                toValidate,
            );
            console.log('🚀 ~ file: app.pipe.ts:93 ~ AppPipe ~ transform ~ result:', result);
            console.log('result :>> ', result?.transform);
            // 如果dto类的中存在transform静态方法,则返回调用进一步transform之后的结果
            // 默认情况下，dto类中不存在 transform 静态方法
            if (typeof result.transform === 'function') {
                result = await result.transform(result);
                const { transform, ...data } = result;
                result = data;
            }
            // 重置验证选项
            this.validatorOptions = originOptions;
            // 重置transform选项
            this.transformOptions = originTransform;
            return result;
        } catch (error: any) {
            // 重置验证选项
            this.validatorOptions = originOptions;
            // 重置transform选项
            this.transformOptions = originTransform;
            if ('response' in error) throw new BadRequestException(error.response);
            throw new BadRequestException(error);
        }
    }
}
