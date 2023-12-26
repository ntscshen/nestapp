import {
    ClassSerializerContextOptions,
    ClassSerializerInterceptor,
    PlainLiteralObject,
    StreamableFile,
} from '@nestjs/common';
import { isArray, isNil, isObject } from 'lodash';

export class AppInterceptor extends ClassSerializerInterceptor {
    serialize(
        response: PlainLiteralObject | PlainLiteralObject[],
        options: ClassSerializerContextOptions,
    ): PlainLiteralObject | Array<PlainLiteralObject> {
        // 是否为文件流 || (不是对象 && 不是数组)
        if (response instanceof StreamableFile || (!isObject(response) && !isArray(response))) {
            return response;
        }

        // 如果响应数据是数组，则循环，对每一项进行序列化
        if (isArray(response)) {
            return (response as Array<PlainLiteralObject>).map((item) => {
                if (isObject(item)) {
                    return this.transformToPlain(item, options);
                }
                return item;
            });
        }

        // 如果是分页数据，对分页数据进行序列化
        if (isObject(response) && 'items' in response && 'meta' in response) {
            const { items } = response;
            const itemsTemp = !isNil(items) && isArray(items) ? items : [];
            return {
                ...response,
                items: (itemsTemp as Array<PlainLiteralObject>).map((item) => {
                    if (isObject(item)) {
                        return this.transformToPlain(item, options);
                    }
                    return item;
                }),
            };
        }
        return this.transformToPlain(response, options);
    }
}
