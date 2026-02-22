import path from 'node:path';
import {fileURLToPath} from 'node:url';
import type {StorybookConfig} from '@storybook/preact-vite';
import tailwindcss from '@tailwindcss/vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const preactPath = path.resolve(__dirname, '../node_modules/preact');

const config: StorybookConfig = {
    stories: ['../src/**/*.stories.@(ts|tsx)'],
    addons: ['@storybook/addon-docs', '@storybook/addon-themes'],
    framework: '@storybook/preact-vite',
    viteFinal(config) {
        config.resolve ??= {};
        config.resolve.alias = {
            ...(config.resolve.alias as Record<string, string>),
            react: path.join(preactPath, 'compat'),
            'react-dom': path.join(preactPath, 'compat'),
            'react/jsx-runtime': path.join(preactPath, 'jsx-runtime'),
            'react/jsx-dev-runtime': path.join(preactPath, 'jsx-dev-runtime'),
        };
        config.resolve.dedupe = [
            ...(config.resolve.dedupe ?? []),
            'preact',
            'preact/compat',
            'preact/hooks',
            'preact/jsx-runtime',
        ];

        // Force pre-bundling of preact and @enonic/ui together so that:
        // 1. Aliases resolve "react" → preact/compat during esbuild, giving a
        //    single preact instance (avoids __H undefined / broken hooks).
        // 2. CJS deps like focus-trap-react get converted to ESM (avoids
        //    missing named export errors).
        // See CLAUDE.md "Storybook" section for full explanation.
        config.optimizeDeps ??= {};
        config.optimizeDeps.include = [
            ...(config.optimizeDeps.include ?? []),
            'preact',
            'preact/hooks',
            'preact/compat',
            '@enonic/ui',
        ];

        config.plugins ??= [];
        config.plugins.push(tailwindcss());

        return config;
    },
};

export default config;
