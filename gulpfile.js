var gulp = require('gulp'),
    browserSync = require('browser-sync'),
    sass = require('gulp-sass'),
    sourcemaps = require('gulp-sourcemaps'),
    autoprefixer = require('gulp-autoprefixer'),
    cleanCSS = require('gulp-clean-css'),
    uglify = require('gulp-uglify'),
    concat = require('gulp-concat'),
    sequence = require('run-sequence'),
    babelify = require('babelify'),
    browserify = require('browserify'),
    source = require('vinyl-source-stream'),
    buffer = require('vinyl-buffer');

gulp.task('default', ['serve']);

gulp.task('serve', ['sass','es6','moveExtraJS'], function() {

    browserSync({
        server: 'app'
    });

    gulp.watch('app/*.html', ['reload']);
    gulp.watch('app/scss/**/*.scss', ['sass']);
    gulp.watch('app/scripts/main.js', function() {
        sequence('es6', ['reload']);
    });

});

gulp.task('reload', function() {
    browserSync.reload();
});

gulp.task('sass', function() {
    return gulp.src('app/scss/**/*.scss')
        .pipe(sourcemaps.init())
        .pipe(sass().on('error', sass.logError))
        .pipe(autoprefixer({
            browsers: ['last 2 versions']
        }))
        .pipe(sourcemaps.write())
        .pipe(gulp.dest('app/css'))
        .pipe(browserSync.stream());
});

gulp.task('es6', function() {
	browserify('app/scripts/main.js')
		.transform('babelify', {
			presets: ['env']
		})
		.bundle()	
		.pipe(source('main.js'))
		.pipe(buffer())
		.pipe(gulp.dest('app/js'));
});

gulp.task('moveExtraJS', function() {
    return gulp.src('app/scripts/extra/**/*')
        .pipe(gulp.dest('app/js/extra'))
        .pipe(gulp.dest('dist/js/extra'));
});

gulp.task('build', ['css', 'js','moveExtraJS']);

gulp.task('css', function() {
    return gulp.src('app/css/**/*.css')
        .pipe(concat('style.css'))
        .pipe(cleanCSS())
        .pipe(gulp.dest('dist/css'));
});

gulp.task('js', function() {
    browserify('app/scripts/main.js')
		.transform('babelify', {
			presets: ['env']
		})
        .bundle()
        .pipe(uglify())
		.pipe(source('main.js'))
		.pipe(buffer())
		.pipe(gulp.dest('dist/js'));
});