import path from 'node:path';
import {fileURLToPath} from 'node:url';
import inject from '@rollup/plugin-inject';
import autoprefixer from 'autoprefixer';
import cssnano from 'cssnano';
import postcssNormalize from 'postcss-normalize';
import postcssSortMediaQueries from 'postcss-sort-media-queries';
import {defineConfig, type UserConfig} from 'vite';

const allowedTargets = ['js', 'css'] as const;
type BuildTarget = (typeof allowedTargets)[number];

const isBuildTarget = (target: string | undefined): target is BuildTarget => {
    return allowedTargets.includes(target as BuildTarget);
};

const __dirname = path.dirname(fileURLToPath(import.meta.url)) ?? '';

export default defineConfig(({mode}) => {
    const {BUILD_TARGET} = process.env;
    const target = isBuildTarget(BUILD_TARGET) ? BUILD_TARGET : 'js';

    const isProduction = mode === 'production';
    const isDevelopment = mode === 'development';

    const IN_PATH = path.join(__dirname, 'src/main/resources/assets/admin/common');
    const OUT_PATH = path.join(__dirname, 'build/resources/main/assets/admin/common');

    const CONFIGS: Record<BuildTarget, UserConfig> = {
        js: {
            root: IN_PATH,
            base: './',

            build: {
                outDir: OUT_PATH,
                emptyOutDir: false,
                target: 'ES2023',
                minify: isProduction,
                sourcemap: isDevelopment ? 'inline' : false,
                ...(isProduction && {
                    reportCompressedSize: true,
                    chunkSizeWarningLimit: 1000,
                }),
                lib: {
                    entry: path.join(IN_PATH, 'js/lib.ts'),
                    name: 'lib',
                    fileName: () => 'js/lib.js',
                    formats: ['iife'],
                },
                rollupOptions: {
                    onwarn(warning, warn) {
                        // Suppress INVALID_ANNOTATION warnings from @enonic/ui
                        if (warning.code === 'INVALID_ANNOTATION' && warning.id?.includes('@enonic/ui')) {
                            return;
                        }
                        warn(warning);
                    },
                    plugins: [
                        inject({
                            $: 'jquery',
                            jQuery: 'jquery',
                        }),
                    ],
                    output: {
                        format: 'iife',
                        ...(isProduction && {
                            compact: true,
                            generatedCode: {
                                constBindings: true,
                            },
                        }),
                    },
                },
            },
            esbuild: {
                minifyIdentifiers: false,
                keepNames: true,
                jsx: 'automatic',
                jsxImportSource: 'preact',
                jsxDev: isDevelopment,
            },
            resolve: {
                alias: {
                    react: 'preact/compat',
                    'react-dom': 'preact/compat',
                    'react/jsx-runtime': 'preact/jsx-runtime',
                    'react/jsx-dev-runtime': 'preact/jsx-dev-runtime',
                },
                extensions: ['.tsx', '.ts', '.jsx', '.js'],
            },
            ...(isDevelopment && {
                server: {
                    open: false,
                    hmr: true,
                },
                clearScreen: false,
            }),
            ...(isProduction && {
                logLevel: 'warn',
            }),
        },
        css: {
            root: IN_PATH,
            base: './',
            build: {
                outDir: OUT_PATH,
                emptyOutDir: false,
                minify: isProduction,
                sourcemap: isDevelopment,
                rollupOptions: {
                    input: {
                        'styles/lib': path.join(IN_PATH, 'styles/main.less'),
                        'styles/lib-lite': path.join(IN_PATH, 'styles/main.lite.less'),
                    },
                    output: {
                        assetFileNames: assetInfo => {
                            const assetName = assetInfo.names[0] ?? '';
                            if (assetName.endsWith('.css')) {
                                const name = assetName.replace(/\.(less|css)$/, '');
                                return `${name}.css`;
                            }
                            if (/\.(svg|png|jpg|gif)$/.test(assetName)) {
                                return 'images/[name][extname]';
                            }
                            if (/\.(woff|woff2|ttf|eot)$/.test(assetName)) {
                                return 'fonts/[name][extname]';
                            }
                            return '[name][extname]';
                        },
                    },
                },
            },
            resolve: {
                alias: {
                    '~enonic-admin-artifacts': 'enonic-admin-artifacts/index.less',
                },
                extensions: ['.less', '.css'],
            },
            css: {
                preprocessorOptions: {
                    less: {
                        javascriptEnabled: true,
                    },
                },
                postcss: {
                    plugins: [
                        postcssNormalize(),
                        autoprefixer(),
                        postcssSortMediaQueries({sort: 'desktop-first'}),
                        ...(isProduction ? [cssnano()] : []),
                    ],
                },
                devSourcemap: isDevelopment,
            },
        },
    };

    return CONFIGS[target];
});
