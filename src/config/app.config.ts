import { toNumber } from 'lodash';

import { createAppConfig } from '@/modules/core/app';

export const app = createAppConfig((configure) => ({
    port: configure.env.get('APP_PORT', (v) => toNumber(v), 3000),
    prefix: 'api',
    // url: 'http://localhost:3000',
}));
