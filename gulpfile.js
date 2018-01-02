var gulp = require('gulp'),
    browserSync = require('browser-sync');

gulp.task('default', ['serve']);

gulp.task('serve', function() {

    browserSync({
        server: 'app'
    });

    gulp.watch(
        [
            'app/*.html',
            'app/scss/*.scss',
            'app/js/*.js'
        ],
        ['reload']
    );

});

gulp.task('reload', function() {
    browserSync.reload();
});