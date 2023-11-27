import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseUUIDPipe,
    Patch,
    Post,
    Query,
    SerializeOptions,
    UseInterceptors,
    ValidationPipe,
} from '@nestjs/common';

import { AppInterceptor } from '@/modules/core/providers';

import { CreatePostDto, QueryPostDto, UpdatePostDto } from '../dots/post.dto';
import { PostService } from '../services';

// interceptor /ɪntə'septə/ n.拦截机
// UseInterceptors(AppInterceptor) 当前路由中定义的每个路由处理程序都将使用 AppInterceptor
@UseInterceptors(AppInterceptor)
@Controller('posts')
export class PostController {
    constructor(private postService: PostService) {}

    // 有了 DTO 之后不代表可以自动对请求数据进行验证
    @Post()
    @SerializeOptions({ groups: ['post-create'] })
    async create(
        @Body(
            // 1. 在装饰器上(Query, Body)加 ValidationPipe 管道才能对请求数据进行验证
            new ValidationPipe({
                // 在输入数据之前，对数据进行转换，确保符合预期的类型，尤其是当你想要确保输入数据时正确类型的时候
                transform: true,
                // 仅允许在类的DTO 中定义的属性通过验证。如果设置为false，则所有属性都降通过验证
                whitelist: true,
                // 禁止非白名单属性。如果请求中包含任何未在DTO中定义的属性，将会抛出一个错误
                // forbid v.禁止，阻止
                forbidNonWhitelisted: true,
                // 如果输入数据中含有未知属性，那么将会抛出错误。
                // 代表被验证的DTO类上必须至少有一个属性使用了 class-validator 中的验证规则(非强制必要)
                forbidUnknownValues: false,
                // 当验证失败时，控制错误对象的形状，是错误对象更简洁，不包含验证失败对象的详细信息
                validationError: { target: false },
                groups: ['create'],
            }),
        )
        data: CreatePostDto,
        // 2. 我们需要把 DTO 作为类型添加到控制器的方法上(API端点的参数上)
    ) {
        return this.postService.create(data);
    }

    @Delete(':id')
    async delete(@Param('id', new ParseUUIDPipe()) id: string) {
        return this.postService.delete(id);
    }

    @Patch()
    @SerializeOptions({ groups: ['post-detail'] })
    async update(
        @Body(
            new ValidationPipe({
                // 在验证前，把请求数据转换为 DTO 实例
                transform: true,
                // 过滤掉没有添加验证器的多余属性
                // 如果该属性存在于DTO中，但没有添加验证器，又不想被过滤，可以添加 @Allow 装饰器
                whitelist: true,
                // 设置为true, 当请求中 DTO 中不存在的多余属性被传入，nestjs会抛出403异常
                forbidNonWhitelisted: true,
                // 被验证的DTO类上必须至少有一个属性使用 class-validator 中的验证规则(是否设置无关紧要)
                forbidUnknownValues: true,
                // 不会在响应数据中将我们的验证类也暴露出来
                validationError: { target: false },
                // 用于设置验证组
                groups: ['update'],
            }),
        )
        data: UpdatePostDto,
    ) {
        return this.postService.update(data);
    }

    @Get(':id')
    async detail(@Param('id', new ParseUUIDPipe()) id: string) {
        return this.postService.detail(id);
    }

    @Get()
    async list(
        @Query(
            new ValidationPipe({
                transform: true,
                whitelist: true,
                forbidNonWhitelisted: true,
                forbidUnknownValues: true,
                validationError: { target: false },
            }),
        )
        options: QueryPostDto,
    ) {
        return this.postService.paginate(options);
    }
}
