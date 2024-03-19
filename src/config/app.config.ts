import { toNumber } from 'lodash';

import { createAppConfig } from '@/modules/core/app';

export const app = createAppConfig((configure) => ({
    port: configure.env.get('APP_PORT', (v) => toNumber(v), 3000),
    prefix: 'api',
    url: 'http://124.223.78.185:3000',
    // url: 'http://127.0.0.1:3000',
}));
