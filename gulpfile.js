var gulp = require('gulp');
var less = require('gulp-less');
var rename = require('gulp-rename');
var sourceMaps = require("gulp-sourcemaps");
var LessAutoPrefix = require('less-plugin-autoprefix');
var include = require("gulp-include");
var ts = require('gulp-typescript');
var del = require('del');
var sequence = require('gulp-sequence');
var tsLint = require('gulp-tslint');
var path = require('path');

var autoPrefix = new LessAutoPrefix({
    browsers: ['last 3 versions', 'ie 11']
});

function lessCss(src, outDir, outName) {
    return gulp
        .src('src/main/resources/assets/' + src)
        .pipe(sourceMaps.init())
        .pipe(less({
            plugins: [autoPrefix],
            relativeUrls: true
        }))
        .pipe(rename(outName))
        .pipe(sourceMaps.write())
        .pipe(gulp.dest('src/main/resources/assets/' + outDir));
}

function typescript(src, out, decl) {
    var tsResult = gulp
        .src('src/main/resources/assets/' + src)
        .pipe(sourceMaps.init())
        .pipe(ts({
            out: 'src/main/resources/assets/' + out,
            target: 'ES5',
            lib: [
                "ES5",
                "ES6",
                "DOM"
            ],
            declaration: decl,
            noImplicitAny: false
        }));

    tsResult.js
        .pipe(sourceMaps.write('./'))
        .pipe(gulp.dest('./'));

    return tsResult.dts
        .pipe(gulp.dest('./'));
}

gulp.task('less-admin', function () {
    return lessCss('admin/common/styles/_module.less', 'admin/common/styles', '_all.css');
});

/*gulp.task('less-live-edit', function () {
    return lessCss('admin/live-edit/styles/_module.less', 'admin/live-edit/styles', '_all.css');
});*/

gulp.task('less-html-editor', function () {
    return lessCss('admin/common/styles/api/util/htmlarea/html-editor.module.less',
        'admin/common/styles/api/util/htmlarea',
        'html-editor.css');
});

gulp.task('ts-admin', function () {
    return typescript('admin/common/js/_module.ts', 'admin/common/js/_all.js', true);
});

/*gulp.task('ts-live', function () {
    return typescript('admin/live-edit/js/_module.ts', 'admin/live-edit/js/_all.js', false);
});*/

gulp.task('ts-spec', function () {
    return typescript('spec/_spec.ts', 'spec/_all.js', false);
});

gulp.task('lint', function () {
    var patterns = [];
    patterns.push('src/main/resources/assets/**/*.ts');
    patterns.push('!src/main/resources/assets/**/*.d.ts');

    return gulp.src(patterns)
        .pipe(tsLint({
            formatter: 'prose',
            configuration: path.resolve('./tslint.json')
        }))
        .pipe(tsLint.report({
            emitError: false
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
    var paths = [];
    paths.push('src/main/resources/assets/**/_all.*');

    return del(paths, {
        dot: true
    });
});

gulp.task('less', ['less-admin', /*'less-live-edit',*/ 'less-html-editor']);
gulp.task('ts', sequence('ts-admin', [/*'ts-live',*/ 'ts-spec']));
gulp.task('combine', ['combine-js']);

gulp.task('all', sequence(['less', 'combine'], 'lint', 'ts'));
gulp.task('default', ['all']);
