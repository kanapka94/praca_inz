var gulp = require('gulp'),
    autoprefixer = require('gulp-autoprefixer'),
    babelify = require('babelify'),
    browserify = require('browserify'),
    browserSync = require('browser-sync'),
    buffer = require('vinyl-buffer'),
    cleanCSS = require('gulp-clean-css'),
    concat = require('gulp-concat'),
    del = require('del'),
    sass = require('gulp-sass'),
    sequence = require('run-sequence'),
    source = require('vinyl-source-stream'),
    sourcemaps = require('gulp-sourcemaps'),
    streamify = require('gulp-streamify'),
    uglify = require('gulp-uglify');

gulp.task('default', ['serve']);

gulp.task('serve', ['sass','es6','moveExtraJS'], function() {

    browserSync({
        server: 'app'
    });

    gulp.watch('app/*.html', ['reload']);
    gulp.watch('app/scss/**/*.scss', ['sass']);
    gulp.watch(['app/scripts/main.js', 'app/scripts/lib/**/*'], function() {
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
	browserify('app/scripts/main.js', { debug: true })
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

gulp.task('clean', function() {
    return del(['dist']);
});

gulp.task('build', function() {
    sequence('clean', ['html', 'css', 'js','moveExtraJS']);
});

gulp.task('html', function() {
    return gulp.src('app/*.html')
        .pipe(gulp.dest('dist'));
});

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
        .pipe(source('main.js'))
        .pipe(streamify(uglify()))
		.pipe(gulp.dest('dist/js'));
});