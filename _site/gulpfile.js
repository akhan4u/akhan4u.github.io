/*!
 * Amaan Khan Gulpfile (https://akhan4u.github.io)
 * Copyright 2017 Amaan Khan
 * Licensed under MIT (https://github.com/akhan4u/akhan4u.github.io/blob/master/LICENSE)
 */

'use strict';

// Load plugins
var gulp = require('gulp');
var del = require('del');
var watch = require('gulp-watch');
var flatten = require('gulp-flatten');
var rename = require('gulp-rename');
var header = require('gulp-header');
var pkg = require('./package.json');
var eslint = require('gulp-eslint');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var scssLint = require('gulp-scss-lint');
var scss = require('gulp-sass');
var prefix = require('gulp-autoprefixer');
var minify = require('gulp-cssnano');
var svgstore = require('gulp-svgstore');
var svgmin = require('gulp-svgmin');
var browserSync = require('browser-sync');
var cp = require('child_process');

// Browsers compability
var COMPATIBILITY = [
  '> 1%',
  'last 2 versions',
  'IE 10'
];

// Scripts source paths
var SCRIPTS_SRC = [
  'src/js/jquery.js',
  'src/js/popper.js',
  'src/js/bootstrap/util.js',
  // 'src/js/bootstrap/alert.js',
  // 'src/js/bootstrap/button.js',
  // 'src/js/bootstrap/carousel.js',
  'src/js/bootstrap/collapse.js',
  // 'src/js/bootstrap/dropdown.js',
  // 'src/js/bootstrap/modal.js',
  // 'src/js/bootstrap/scrollspy.js',
  // 'src/js/bootstrap/tab.js',
  'src/js/bootstrap/tooltip.js',
  // 'src/js/bootstrap/popover.js',
  'src/js/svg4everybody.js',
  'src/js/nprogress.js',
  'src/js/headroom.js',
  'src/js/jQuery.headroom.js',
  'src/js/scripts.js'
];

// Jekyll uncompiled files
var JEKYLL_SRC = [
  '_includes/**',
  '_layouts/**',
  '_pages/**',
  '_posts/**',
  'writings/**'
];

// Make npm command work on Windows platform
var npm = (process.platform === 'win32') ? 'npm.cmd' : 'npm';

// Banner template for files header
var banner = ['/*!',
  ' * <%= pkg.title %> (<%= pkg.url %>)',
  ' * Copyright ' + new Date().getFullYear() + ' <%= pkg.author %>',
  ' * Licensed under <%= pkg.license %> (https://github.com/akhan4u/akhan4u.github.io/blob/master/LICENSE)',
  ' */',
  '\n'
].join('\n');

// Remove pre-existing content from the folders
gulp.task('clean', function () {
  return del(['assets/js', 'assets/css', 'assets/fonts', 'assets/icons']);
});

gulp.task('clean:scripts', function () {
  return del(['assets/js']);
});

gulp.task('clean:styles', function () {
  return del(['assets/css']);
});

gulp.task('clean:fonts', function () {
  return del(['assets/fonts']);
});

gulp.task('clean:icons', function () {
  return del(['assets/icons']);
});

// Test scripts
gulp.task('test:scripts', function () {
  return gulp.src(['src/js/**/*.js', '!src/js/**/jquery.js', '!src/js/bootstrap/**'])
    .pipe(eslint('src/js/.eslintrc.json'))
    .pipe(eslint.format());
});

// Test styles
gulp.task('test:styles', function () {
  return gulp.src(['src/scss/**/*.scss', '!src/scss/bootstrap/**', '!src/scss/font-awesome/**'])
    .pipe(scssLint({ 'config': 'src/scss/.scss-lint.yml' }));
});

// Concatenate and minify scripts
gulp.task('build:scripts', function () {
  return gulp.src(SCRIPTS_SRC)
    .pipe(concat('scripts.js'))
    .pipe(header(banner, { pkg : pkg }))
    .pipe(gulp.dest('assets/js'))
    .pipe(rename({ suffix: '.min' }))
    .pipe(uglify())
    .pipe(gulp.dest('assets/js'));
});

// Process and minify styles
gulp.task('build:styles', function () {
  return gulp.src('src/scss/styles.scss')
    .pipe(header(banner, { pkg : pkg }))
    .pipe(scss({ precision: 6, outputStyle: 'expanded' }))
    .pipe(prefix({ browsers: COMPATIBILITY }))
    .pipe(gulp.dest('assets/css'))
    .pipe(rename({ suffix: '.min' }))
    .pipe(minify({ discardComments: { removeAll: true } }))
    .pipe(gulp.dest('assets/css'));
});

// Process and minify icons
gulp.task('build:icons', function () {
  return gulp.src('src/icons/**/*.svg', { base: 'src/icons' })
    .pipe(svgmin())
    .pipe(rename({prefix: 'icon-'}))
    .pipe(svgstore({ inlineSvg: true }))
    .pipe(rename({ suffix: '.min' }))
    .pipe(gulp.dest('assets/icons'));
});

// Copy fonts
gulp.task('copy:fonts', function () {
  return gulp.src('src/fonts/**')
    .pipe(flatten())
    .pipe(gulp.dest('assets/fonts'));
});

// Default task
gulp.task('default', ['clean'], function () {
  gulp.start('build:scripts', 'build:styles', 'build:icons', 'copy:fonts');
});

// Remove pre-existing Jekyll build site content
gulp.task('clean:jekyll', function () {
  return del(['./_site']);
});

// Build the Jekyll site
gulp.task('build:jekyll', ['default'], function (done) {
  browserSync.notify('Compiling Jekyll, please wait!');
  return cp.spawn(npm, ['run', 'jekyll-build'], { stdio: 'inherit' })
    .on('close', done);
});

// Wait for Jekyll build, then launch the server
gulp.task('browser-sync', ['clean:jekyll', 'build:jekyll'], function () {
  browserSync({
    port: 4000,
    ui: {
      port: 4001
    },
    server: {
      baseDir: './_site'
    },
  });
});

// Rebuild scripts and do page reload
gulp.task('rebuild:scripts', function () {
  return gulp.src(SCRIPTS_SRC)
    .pipe(concat('scripts.js'))
    .pipe(header(banner, { pkg : pkg }))
    .pipe(gulp.dest('./_site/assets/js'))
    .pipe(rename({ suffix: '.min' }))
    .pipe(uglify())
    .pipe(gulp.dest('./_site/assets/js'))
    .pipe(browserSync.reload({ stream: true }));
});

// Rebuild styles and do page reload
gulp.task('rebuild:styles', function () {
  return gulp.src('src/scss/styles.scss')
    .pipe(header(banner, { pkg : pkg }))
    .pipe(scss({ precision: 6, outputStyle: 'expanded' }))
    .pipe(prefix({ browsers: COMPATIBILITY }))
    .pipe(gulp.dest('./_site/assets/css'))
    .pipe(rename({ suffix: '.min' }))
    .pipe(minify({ discardComments: { removeAll: true } }))
    .pipe(gulp.dest('./_site/assets/css'))
    .pipe(browserSync.reload({ stream: true }));
});

// Rebuild Jekyll and do page reload
gulp.task('rebuild:jekyll', ['build:jekyll'], function () {
  browserSync.reload();
});

// Watch changes
gulp.task('watch', ['browser-sync'], function () {
  // Watch .js files
  gulp.watch('src/js/**/*.js', ['rebuild:scripts']);
  // Watch .scss files
  gulp.watch('src/scss/**/*.scss', ['rebuild:styles']);
  // Watch Jekyll uncompiled files
  gulp.watch(JEKYLL_SRC, ['rebuild:jekyll']);
});
