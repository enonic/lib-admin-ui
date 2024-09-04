const baseConfig = require('@enonic/eslint-config');

module.exports = [
    ...baseConfig, // This includes the extended configuration from @enonic/eslint-config
    {
        files: ["**/*.ts", "**/*.tsx"], // Apply rules to TypeScript files
        languageOptions: {
            parserOptions: {
                project: './tsconfig.json',
                tsconfigRootDir: __dirname,
            }
        },
        rules: {
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
        },
    },
    {
        ignores: [
            "**/node_modules/",
            "**/build/",
            "**/dist/",
            "**/.xp/",
            "**/*.js",
            "**/*.d.ts",
            "**/spec/**/*",
        ]
    }
];

