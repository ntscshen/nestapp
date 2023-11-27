import {
    ClassSerializerContextOptions,
    ClassSerializerInterceptor,
    PlainLiteralObject,
    StreamableFile,
} from '@nestjs/common';
import { IsObject } from 'class-validator';
import { isArray, isNil, isObject } from 'lodash';

/*
这段代码是一个 NestJS 拦截器(Interceptor), 用于在响应数据被发送到客户端之前对其进行序列化处理
这个拦截器继承了 'ClassSerializerInterceptor', 并覆盖了其中的 'serialize'方法, 以添加一些自定义的序列化逻辑

serialize 序列化 vt.连载，连播 /ˈsɪəri:əˌlaɪz/ sei瑞鹅莱斯
serializer 序列化器, 串行器
Interceptor n.拦截机

serialize 对非空对象
transformToPlain: 将给定对象(通常是一个类实体)转换为普通JavaScript对象( plain object )
PlainLiteralObject --- [key: string]: any;
*/
export class AppInterceptor extends ClassSerializerInterceptor {
    // 重写了 'serialize' 方法。
    // 序列化非空对象或可流文件的响应
    serialize(
        response: PlainLiteralObject | Array<PlainLiteralObject>,
        options: ClassSerializerContextOptions,
    ): PlainLiteralObject | Array<PlainLiteralObject> {
        // 这个检查避免对非标准响应数据进行序列化，保持他们的原始状态
        if ((!isObject(response) && !isArray(response)) || response instanceof StreamableFile) {
            return response;
        }
        // 如果响应数据时数组，则遍历对每一项进行序列化
        if (isArray(response)) {
            return (response as PlainLiteralObject[]).map((item) => {
                return !IsObject(item) ? item : this.transformToPlain(item, options);
                // 如果内容不是对象, 则直接返回, 否则调用transformToPlain 进行序列化
            });
        }
        // 如果是分页数据， 则对items中的每一项进行序列化
        // 确保当响应数据时分页个时时，items数组中的每个对象都会被序列化。如果响应中的 items 字段不是数组或者数组中包含了非对象元素。这段代码也能处理，保证代码健壮性
        // 检查是否包含 meta和items
        if ('meta' in response && 'items' in response) {
            const items = !isNil(response.items) && isArray(response.items) ? response.items : [];
            return {
                ...response,
                items: (items as PlainLiteralObject[]).map((item) => {
                    return !isObject(item) ? item : this.transformToPlain(item, options);
                }),
            };
        }
        // 如果响应是个对象，则直接序列化
        return this.transformToPlain(response, options);
    }
}

/*
plain /pleɪn/ adj.清晰的，简单的，朴素的
transformToPlain 将数据对象转换为普通JS对象
用于将给定对象(通常是一个实例)转化为普通JS对象( plain object )
plainOrClass:any -> 要转换的数据对象(可以使类实例或普通对象)
options? -> 影响转换行为的配置( 包含 class-transformer 库的配置 )

*/
