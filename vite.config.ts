import path from 'node:path';
import {fileURLToPath} from 'node:url';
import autoprefixer from 'autoprefixer';
import cssnano from 'cssnano';
import postcssNormalize from 'postcss-normalize';
import postcssSortMediaQueries from 'postcss-sort-media-queries';
import {defineConfig} from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url)) ?? '';

export default defineConfig(({mode}) => {
    const isProduction = mode === 'production';
    const isDevelopment = mode === 'development';

    const IN_PATH = path.join(__dirname, 'src/main/resources/assets/admin/common');
    const OUT_PATH = path.join(__dirname, 'build/resources/main/assets/admin/common');

    return {
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
    };
});
