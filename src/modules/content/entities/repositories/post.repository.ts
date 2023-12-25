import { Repository } from 'typeorm';

import { CustomRepository } from '@/modules/database/decorators/repository.decorator';

import { PostEntity } from '../post.entity';

@CustomRepository(PostEntity)
export class PostRepository extends Repository<PostEntity> {
    buildBaseQB() {
        return this.createQueryBuilder('post');
    }
}

// decorator /'dekəreɪtə/ 装饰工 油漆匠
