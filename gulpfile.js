import { sync } from '../../../../Users/adam/Library/Caches/typescript/2.6/node_modules/@types/glob';

var gulp = require('gulp'),
    browserSync = require('browser-sync'),
    sass = require('gulp-sass');

gulp.task('default', ['serve']);

gulp.task('serve', ['sass'], function() {

    browserSync({
        server: 'app'
    });

    gulp.watch('app/*.html', ['reload']);
    gulp.watch('app/scss/**/*.scss', ['sass']);

});

gulp.task('reload', function() {
    browserSync.reload();
});

gulp.task('sass', function() {
    return gulp.src('app/scss/**/*.scss')
        .pipe(sass().on('error', sass.logError))
        .pipe(gulp.dest('app/css'))
        .pipe(browserSync.stream());
});