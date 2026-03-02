import baseConfig from '@enonic/eslint-config';
import {plugin as tsPlugin} from 'typescript-eslint';

export default [
    // This includes the extended configuration from @enonic/eslint-config
    ...baseConfig,
    {
        files: ["**/*.ts", "**/*.tsx"],
        languageOptions: {
            parserOptions: {
                project: './tsconfig.json',
                tsconfigRootDir: __dirname,
            }
        },
        plugins: {
            '@typescript-eslint': tsPlugin,
        },
        rules: {
            // TODO: Fix these rules
            'no-control-regex': 'off',
            'constructor-super': 'error',
            'prefer-const': 'off',
            'no-plusplus': 'off',
            'no-extra-boolean-cast': 'off',
            'no-prototype-builtins': 'off',
            'no-useless-escape': 'off',
            'no-empty-pattern': 'off',
            '@typescript-eslint/no-unsafe-member-access': 'off',
            '@typescript-eslint/no-inferrable-types': 'off',
            '@typescript-eslint/ban-types': 'off',
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-unsafe-return': 'off',
            '@typescript-eslint/no-unsafe-argument': 'off',
            '@typescript-eslint/no-unsafe-assignment': 'off',
            '@typescript-eslint/no-unsafe-call': 'off',
            '@typescript-eslint/no-floating-promises': 'off',
            '@typescript-eslint/restrict-plus-operands': 'off',
            '@typescript-eslint/no-implied-eval': 'off',
            '@typescript-eslint/no-empty-function': 'off',
            '@typescript-eslint/no-empty-interface': 'off',
            '@typescript-eslint/explicit-function-return-type': 'off',
            'comma-dangle': 'off',
            '@typescript-eslint/member-ordering': 'off',
            'spaced-comment': 'off',
            '@typescript-eslint/no-use-before-define': 'off',
            '@typescript-eslint/unbound-method': 'off',
            '@typescript-eslint/no-base-to-string': 'off',
            '@typescript-eslint/no-unused-vars': 'off',
        },
    },
    {
        ignores: [
            "vite.config.ts",
            "eslint.config.ts",
            "build/**/*",
            "dist/**/*",
            "node_modules/**/*",
            "**/.xp/**/*",
            "**/*.js",
            "**/*.d.ts",
        ]
    }
];

