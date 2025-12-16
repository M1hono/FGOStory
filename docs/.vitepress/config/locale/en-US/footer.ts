import type { FooterConfig } from '../../../utils/content/footer';
import { createIconConfig, createLinkConfig, createGroupConfig } from '../../../utils/content/footer';

export const footerConfig: FooterConfig = {
    beian: {
        showIcon: true,
        icp: {
            icon: createIconConfig(
                'fluent:globe-shield-48-filled',
                'rgba(20, 150, 255, 1)',
                'rgba(100, 200, 255, 1)'
            ),
            number: 'ICP Registration No. 12345678',
            rel: 'noopener noreferrer',
        },
        police: {
            icon: createIconConfig(
                'fluent:shield-checkmark-48-filled',
                'rgba(50, 200, 50, 1)',
                'rgba(100, 255, 100, 1)'
            ),
            number: 'Public Security Registration No. 12345678',
            rel: 'noopener noreferrer',
        },
    },
    author: {
        icon: createIconConfig('mdi:copyright', '#999', '#ccc'),
        name: 'M1hono',
        link: 'https://github.com/M1hono',
        rel: 'noopener noreferrer',
        text: 'Maintained.',
    },
    group: [
        createGroupConfig(
            'External Links',
            [
                createLinkConfig(
                    'GitHub',
                    'https://github.com/M1hono/M1honoVitepressTemplate',
                    'mdi:github',
                    {
                        rel: 'noopener noreferrer',
                        iconColors: { 
                            light: 'rgba(0, 0, 0, 1)',
                            dark: 'rgba(255, 255, 255, 1)'
                        },
                    }
                ),
                createLinkConfig(
                    'Documentation',
                    'https://vitepress.dev',
                    'mdi:book-open-page-variant',
                    {
                        rel: 'noopener noreferrer',
                        iconColors: { 
                            light: 'rgba(100, 150, 200, 1)',
                            dark: 'rgba(150, 200, 255, 1)'
                        },
                    }
                ),
            ],
            'bx:link',
            { 
                light: 'rgba(255, 87, 51, 1)',
                dark: 'rgba(255, 130, 100, 1)'
            }
        ),
        createGroupConfig(
            'Resources',
            [
                createLinkConfig(
                    'Downloads',
                    '/downloads',
                    'mdi:download',
                    {
                        iconColors: { 
                            light: 'rgba(100, 200, 150, 1)',
                            dark: 'rgba(150, 255, 200, 1)'
                        },
                    }
                ),
                createLinkConfig(
                    'FAQ',
                    '/faq',
                    'mdi:help-circle',
                    {
                        iconColors: { 
                            light: 'rgba(200, 100, 150, 1)',
                            dark: 'rgba(255, 150, 200, 1)'
                        },
                    }
                ),
            ],
            'mdi:tools',
            { 
                light: 'rgba(150, 200, 100, 1)',
                dark: 'rgba(200, 255, 150, 1)'
            }
        ),
    ],
};

export default footerConfig; 