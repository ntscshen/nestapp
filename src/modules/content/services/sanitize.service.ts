import { Injectable } from '@nestjs/common';
import sanitizeHtml from 'sanitize-html';

import { deepMerge } from '@/modules/core/utils';

@Injectable()
export class SanitizeService {
    protected config: sanitizeHtml.IOptions = {};

    constructor() {
        this.config = {
            allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'code']),
            allowedAttributes: {
                ...sanitizeHtml.defaults.allowedAttributes,
                '*': ['class', 'style', 'height', 'width'],
            },
            parser: {
                lowerCaseTags: true,
            },
        };
    }

    // 在需要处理用户输入的 HTML 内容的地方使用，如处理来自用户编辑器的内容。
    // 这有助于防止恶意内容注入，保护应用安全。
    sanitize(body: string, options?: sanitizeHtml.IOptions) {
        return sanitizeHtml(body, deepMerge(this.config, options ?? {}, 'replace'));
    }
}
