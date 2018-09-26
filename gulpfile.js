const gulp = require('gulp');
const gulpIf = require('gulp-if');
const sequence = require('gulp-sequence');
const less = require('gulp-less');
const postcss = require('gulp-postcss');
const browsers = require('browserslist-config-enonic');
const autoprefixer = require('autoprefixer');
const cssMqpacker = require('css-mqpacker');
const cssnano = require('cssnano');
const rename = require('gulp-rename');
const sourceMaps = require('gulp-sourcemaps');
const ts = require('gulp-typescript');
const include = require('gulp-include');
const tsLint = require('gulp-tslint');
const uglify = require('gulp-uglify-es').default;
const del = require('del');
const path = require('path');

const isDev = process.env.NODE_ENV !== 'production';

function lessCss(src, outDir, outName) {
    return gulp
        .src(path.join('src/main/resources/assets/', src))
        .pipe(gulpIf(isDev, sourceMaps.init()))
        .pipe(less({
            relativeUrls: true
        }).on('error', err => {
            console.error(err.message);
            process.exit(1);
        }))
        .pipe(postcss([
            autoprefixer({browsers}),
            cssMqpacker(),
            ...(isDev ? [] : [
                cssnano({preset: 'default'})
            ])
        ]))
        .pipe(rename(outName))
        .pipe(gulpIf(isDev, sourceMaps.write()))
        .pipe(gulp.dest(outDir));
}

function typescript(src, out, decl) {
    const tsResult = gulp
        .src(path.join('src/main/resources/assets/', src))
        .pipe(gulpIf(isDev, sourceMaps.init()))
        .pipe(ts({
            out: path.join('src/main/resources/assets/', out),
            target: 'ES5',
            lib: ['ES5', 'ES6', 'DOM'],
            declaration: decl,
            noImplicitAny: false,
            noUnusedLocals: true,
            noUnusedParameters: true
        }));

    tsResult.js
        .pipe(gulpIf(!isDev, uglify({
            mangle: false,
            keep_fnames: true
        })))
        .pipe(gulpIf(isDev, sourceMaps.write('./')))
        .pipe(gulp.dest('./'));

    return tsResult.dts
        .pipe(gulp.dest('./'));
}

gulp.task('less-admin-full', () => lessCss(
    'admin/common/styles/_module.less',
    'src/main/resources/assets/admin/common/styles',
    '_all.css'
));

gulp.task('less-admin-lite', () => lessCss(
    'admin/common/styles/_module.lite.less',
    'src/main/resources/assets/admin/common/styles',
    '_all.lite.css'
));

gulp.task('ts-admin', () => typescript('admin/common/js/_module.ts', 'admin/common/js/_all.js', true));

gulp.task('ts-spec', () => typescript('spec/_spec.ts', 'spec/_all.js', false));

gulp.task('lint', function () {
    const patterns = [];
    patterns.push('src/main/resources/assets/**/*.ts');
    patterns.push('!src/main/resources/assets/**/*.d.ts');

    return gulp.src(patterns)
        .pipe(tsLint({
            formatter: 'prose',
            configuration: path.resolve('./tslint.json')
        }))
        .pipe(tsLint.report({
            emitError: true
        }));
});

gulp.task('combine-js', function () {
    return gulp
        .src('src/main/resources/assets/admin/common/lib/_include.js')
        .pipe(include())
        .pipe(rename('_all.js'))
        .pipe(gulp.dest('src/main/resources/assets/admin/common/lib'));
});

gulp.task('clean', function () {
    const paths = ['src/main/resources/assets/**/_all.*'];

    return del(paths, {dot: true});
});

gulp.task('less', gulp.parallel('less-admin-full', 'less-admin-lite'));
gulp.task('ts', gulp.series('ts-admin', gulp.task('ts-spec')));
gulp.task('combine', gulp.task('combine-js'));

gulp.task('all', gulp.series(gulp.parallel('less', 'combine'), 'lint', 'ts'));
gulp.task('all:no-lint', gulp.series(gulp.parallel('less', 'combine'), 'ts'));
gulp.task('default', gulp.task('all'));
