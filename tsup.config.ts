import type { Options as TsupOptions } from 'tsup';

import copyPluginModule from '@sprout2000/esbuild-copy-plugin';
// import { globSync } from 'glob';
// import {
//     join,
//     resolve
// } from 'path';
import { defineConfig } from 'tsup';

interface Options extends TsupOptions {
	d?: string
}

// const OUT_DIR_JS = 'build/tmp/src/main/resources/assets/admin/common/js';
// const OUT_DIR_LIB = 'build/tmp/src/main/resources/assets/admin/common/lib';
// const OUT_DIR_JS = 'build/resources/main/assets/admin/common/js';
// const OUT_DIR_LIB = 'build/resources/main/assets/admin/common/lib';
// const OUT_DIR_JS = 'build/resources/main/dev/lib-admin-ui/js';
// const OUT_DIR_LIB = 'build/resources/main/dev/lib-admin-ui/lib';
const OUT_DIR = 'build/npm-lib-admin-ui';

const ENTRY_LIB_ADMIN_UI = 'src/main/resources/assets/admin/common/js/index.ts';
const ENTRY_SLICKGRID = 'src/main/resources/assets/admin/common/lib/slickgrid/index.ts';

export default defineConfig((options: Options) => {
    if (options.entry?.['slickgrid'] === ENTRY_SLICKGRID) {
        return {
            bundle: true,
            dts: false,
            // entry: { // Ignored
            //     'slickgrid': ENTRY_SLICKGRID
            // },
            format: [
                'cjs',
            ],

            minify: false,
            // minify: 'terser',

            outDir: OUT_DIR,
            outExtension() {
                return {
                    js: options.minify ? '.min.js' : '.js',
                }
            },
            platform: 'browser',
            splitting: false,
            sourcemap: true,
            target: 'es5', // lib-admin-ui uses slickgrid which requires this
            terserOptions: {
                mangle: false
            }
        };
    }
    // globSync('src/main/resources/assets/admin/common/js/**/index.ts')
    // if (options.d === OUT_DIR) {
    // console.log(options);
    if (options.entry?.['lib-admin-ui'] === ENTRY_LIB_ADMIN_UI) {
        return {
            bundle: true,
            dts: false,
            entry: ENTRY_LIB_ADMIN_UI,
            // esbuildOptions(options, context) {
            //     // https://esbuild.github.io/api/#global-name
            //     // This option only matters when the format setting is iife
            //     options.globalName = 'enonicLibAdminUi';
            // },
            esbuildPlugins: options.minify ? [] : [
                copyPluginModule.copyPlugin({
                    src: './src/package.json',
                    dest: `./${OUT_DIR}/package.json`,
                }),
                copyPluginModule.copyPlugin({
                    src: './src/README.md',
                    dest: `./${OUT_DIR}/README.md`,
                })
            ],

            format: [
                'iife'
            ],

            // https://esbuild.github.io/api/#global-name
            // This option only matters when the format setting is iife
            globalName: 'enonicLibAdminUi',

            minify: false,
            // minify: 'terser',

            outDir: OUT_DIR,
            outExtension() {
                return {
                    js: options.minify ? '.min.js' : '.js',
                }
            },
            platform: 'browser',
            splitting: false,
            sourcemap: true,
            target: 'es2020',
            terserOptions: {
                mangle: false
            }
        };
    }
    throw new Error(`Unconfigured directory:${options.d}!`);
});
