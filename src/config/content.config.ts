import { ContentConfig } from '@/modules/content/types';

export const content = (): ContentConfig => {
    return {
        searchType: 'against',
        // searchType: 'like',
    };
};
