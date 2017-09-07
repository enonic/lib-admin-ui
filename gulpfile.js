var gulp = require('gulp');
var less = require('gulp-less');
var sourceMaps = require("gulp-sourcemaps");
var LessAutoPrefix = require('less-plugin-autoprefix');

var autoPrefix = new LessAutoPrefix({
    browsers: ['last 3 versions', 'ie 11']
});

gulp.task('all', []);
gulp.task('default', ['all']);
