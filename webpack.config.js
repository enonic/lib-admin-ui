const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CircularDependencyPlugin = require('circular-dependency-plugin');
const TerserPlugin = require('terser-webpack-plugin');
// const ProvidePlugin = require('webpack/lib/ProvidePlugin');
const path = require('path');
const fs = require('fs');

const swcConfig = JSON.parse(fs.readFileSync('./.swcrc'));

const MiniCssExtractPluginCleanup = require('./util/MiniCssExtractPluginCleanup');

const isProd = process.env.NODE_ENV === 'production';

module.exports = {
    context: path.join(__dirname, '/src/main/resources/assets/admin/common'),
    entry: {
        'js/lib': './js/lib.ts',
        'styles/lib': './styles/main.less',
        'styles/lib.lite': './styles/main.lite.less',
    },
    externals: [
        {
            dompurify: 'DOMPurify',
            jquery: 'jQuery',
            mousetrap: 'Mousetrap',
            'mousetrap/plugins/global-bind/mousetrap-global-bind': 'Mousetrap',
            q: 'Q',
        },
        function ({
            context,
            request,
            dependencyType,
            contextInfo: {
                issuer,
                // issuerLayer,
                // compiler
            }
        }, callback) {
            // if (!['amd', 'commonjs', 'esm', 'loaderImport', 'url'].includes(dependencyType)) {
            //     console.log({
            //         context,
            //         request,
            //         dependencyType,
            //         issuer
            //     });
            // }
            if (issuer.endsWith('.ts')) {
                if (request.startsWith('@enonic/legacy-slickgrid')) {
                    return callback(null, 'Slick'); // The external is a global variable called `Slick`.
                }
                if (request.startsWith('jquery-ui')) {
                    return callback(null, 'jQuery'); // The external is a global variable called `jQuery`.
                }
                // if (request.startsWith('@swc/helpers')) {
                //     return callback(null, request, dependencyType); // Leave the require as is?
                //     // return callback(null, 'swcHelpers'); // The external is a global variable called `swcHelpers`.
                // }
            }
            if (
                request.startsWith('.')
                || request.endsWith('.gif')
                || request.endsWith('.png')
                || issuer.endsWith('.css')
                || issuer.endsWith('.less')
            ) {
                return callback(); // Continue without externalizing the import
            }
            console.error('Not externalizing unhandeled import', {
                context,
                request,
                dependencyType,
                issuer
            });
            return callback(); // Continue without externalizing the import
        }
    ],
    output: {
        path: path.join(__dirname, '/build/resources/main/assets/admin/common'),
        filename: './[name].js',
        assetModuleFilename: './[file]'
    },
    resolve: {
        extensions: ['.ts', '.js', '.less', '.css']
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: [
                    {
                        loader: 'swc-loader',
                        options: {
                            ...swcConfig,
                            sourceMaps: isProd ? false : 'inline',
                            inlineSourcesContent: !isProd,
                        },
                    },
                ],
            },
            {
                test: /\.less$/,
                use: [
                    {loader: MiniCssExtractPlugin.loader, options: {publicPath: '../'}},
                    {loader: 'css-loader', options: {sourceMap: !isProd, importLoaders: 1}},
                    {loader: 'postcss-loader', options: {sourceMap: !isProd}},
                    {loader: 'less-loader', options: {sourceMap: !isProd}},
                ]
            },
            {
                test: /^((?!icomoon|opensans).)*\.(svg|png|jpg|gif)$/,
                type: 'asset/resource',
                generator: {
                    filename: 'images/[base]'
                }
            }
        ]
    },
    optimization: {
        minimizer: [
            new TerserPlugin({
                terserOptions: {
                    keep_classnames: true,
                    keep_fnames: true
                }
            })
        ]
    },
    plugins: [
        // new ProvidePlugin({
        //     $: 'jquery',
        //     jQuery: 'jquery',
        //     'window.jQuery': 'jquery'
        // }),
        new MiniCssExtractPlugin({
            filename: '[name].css',
            chunkFilename: './styles/[id].css'
        }),
        new MiniCssExtractPluginCleanup([/main\.(lite\.)?js(\.map)?$/]),
        new CircularDependencyPlugin({
            exclude: /a\.js|node_modules/,
            failOnError: true
        }),
    ],
    mode: isProd ? 'production' : 'development',
    devtool: isProd ? false : 'source-map',
    performance: {
        hints: false,
    },
    stats: {
        assets: false,
        modules: false,
    }
};
