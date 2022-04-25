const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CircularDependencyPlugin = require('circular-dependency-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const ProvidePlugin = require('webpack/lib/ProvidePlugin');
const ErrorLoggerPlugin = require('error-logger-webpack-plugin');
const path = require('path');

const MiniCssExtractPluginCleanup = require('./util/MiniCssExtractPluginCleanup');

const isProd = process.env.NODE_ENV === 'production';

module.exports = {
    context: path.join(__dirname, '/src/main/resources/assets/admin/common'),
    entry: {
        'js/lib': './js/lib.ts',
        'styles/lib': './styles/main.less',
        'styles/lib.lite': './styles/main.lite.less',
    },
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
                test: /\.tsx?$/,
                use: [{loader: 'ts-loader', options: {configFile: 'tsconfig.json'}}]
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
                    compress: {
                        drop_console: false
                    },
                    keep_classnames: true,
                    keep_fnames: true
                }
            })
        ]
    },
    plugins: [
        new ProvidePlugin({
            $: 'jquery',
            jQuery: 'jquery',
            'window.jQuery': 'jquery'
        }),
        new MiniCssExtractPlugin({
            filename: '[name].css',
            chunkFilename: './styles/[id].css'
        }),
        new MiniCssExtractPluginCleanup([/main\.(lite\.)?js(\.map)?$/]),
        new CircularDependencyPlugin({
            exclude: /a\.js|node_modules/,
            failOnError: true
        }),
        //new ErrorLoggerPlugin({showColumn: false})
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
