import {defineConfig} from 'vitest/config';

export default defineConfig({
    test: {
        include: ['src/main/resources/assets/admin/common/js/form2/**/*.test.ts'],
        environment: 'node',
        passWithNoTests: true,
    },
    resolve: {
        alias: {
            react: 'preact/compat',
            'react-dom': 'preact/compat',
            'react/jsx-runtime': 'preact/jsx-runtime',
            'react/jsx-dev-runtime': 'preact/jsx-dev-runtime',
        },
    },
});
