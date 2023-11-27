import { EventSubscriber } from 'typeorm';

// import { SanitizeService } from '../services/sanitize.service';

@EventSubscriber()
export class PostSubscriber {}

// 1. 建模型 entity
// 2. 再建 repository
// 3. 有需要的话: 再建 subscriber
// 4. 再建立service
// 5. 最后一步建 控制器
