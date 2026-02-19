import path from 'path';
import {fileURLToPath} from 'url';
import {defineConfig} from 'vitest/config';

const __dirname = path.dirname(fileURLToPath(import.meta.url)) ?? '';

export default defineConfig({
    test: {
        include: ['src/test/**/*.test.ts'],
        environment: 'node',
        passWithNoTests: true,
    },
    resolve: {
        alias: {
            'react': 'preact/compat',
            'react-dom': 'preact/compat',
            'react/jsx-runtime': 'preact/jsx-runtime',
            'react/jsx-dev-runtime': 'preact/jsx-dev-runtime',
        },
    },
});
