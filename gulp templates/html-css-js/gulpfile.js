const { dest, parallel, series, src, watch } = require('gulp');
const autoprefixer = require('autoprefixer');
const browsersync = require('browser-sync').create();
const concat = require('gulp-concat');
const cssnano = require('cssnano');
const imagemin = require('gulp-imagemin');
const postcss = require('gulp-postcss');
const replace = require('gulp-replace');
const svgo = require('gulp-svgo');
const uglify = require('gulp-uglify');

// html task
function htmlTask_PROD() {
  return src('index.html')
    .pipe(replace(/\/output/g, ''))
    .pipe(dest('dist'));
}

// assets
function assetsTask() {
  return src(['src/assets/**', '!src/assets/images/**']).pipe(
    dest('dist/src/assets')
  );
}

// images
function imageminTask() {
  return src('src/assets/images/*.{png,jpg,jpeg}')
    .pipe(imagemin({ verbose: true }))
    .pipe(dest('dist/src/assets/images'));
}

// svgs
function svgoTask() {
  return src('src/assets/images/*.svg')
    .pipe(svgo())
    .pipe(dest('dist/src/assets/images'));
}

// css
function cssTask() {
  const fileOrder = [
    'src/css/reset.css',
    'src/css/fonts.css',
    'src/css/global.css',
    'src/css/compositions.css',
    'src/css/utilities.css',
    'src/css/blocks.css',
    'src/css/exceptions.css',
  ];
  return src(fileOrder, { sourcemaps: true })
    .pipe(concat('styles.css'))
    .pipe(postcss([autoprefixer()]))
    .pipe(dest('src/css', { sourcemaps: '.' }));
}

function cssTask_PROD() {
  const fileOrder = [
    'src/css/reset.css',
    'src/css/fonts.css',
    'src/css/global.css',
    'src/css/compositions.css',
    'src/css/utilities.css',
    'src/css/blocks.css',
    'src/css/exceptions.css',
  ];
  return src(fileOrder, { sourcemaps: true })
    .pipe(concat('styles.css'))
    .pipe(postcss([autoprefixer(), cssnano()]))
    .pipe(dest('dist/src/css', { sourcemaps: '.' }));
}

// js
function jsTaskMain() {
  return src(['src/js/script.js'], {
    sourcemaps: true,
  }).pipe(dest('src/js/output', { sourcemaps: '.' }));
}

function jsTaskSecondary() {
  return src(
    [
      'src/js/**/*.js',
      '!src/js/output',
      '!src/js/tests/**',
      '!src/js/script.js',
      '!src/js/output/**',
    ],
    {
      sourcemaps: true,
    }
  ).pipe(dest('src/js/output', { sourcemaps: '.' }));
}

function jsTask_PROD() {
  return src(['src/js/**/*.js', '!src/js/__tests__/**', '!src/js/output/**'], {
    sourcemaps: true,
  })
    .pipe(uglify())
    .pipe(dest('dist/src/js', { sourcemaps: '.' }));
}

// cache-busting
// note, don't forget to append within the index.html, ?cb=123 to any link and scripts
function cacheBustTask() {
  let cbNumber = new Date().getTime();
  return src('index.html')
    .pipe(replace(/cb=\d+/g, 'cb=' + cbNumber))
    .pipe(dest('.'));
}

// browsersync
function browserSyncServe(cb) {
  browsersync.init({
    server: {
      baseDir: '.',
    },
  });
  cb();
}

function browserSyncReload(cb) {
  browsersync.reload();
  cb();
}

// watch
function watchTask() {
  watch('index.html', browserSyncReload);

  watch(
    ['src/css/**/*.css', 'src/js/**/*.js', '!src/js/tests/*.js'],
    series(
      cssTask,
      jsTaskMain,
      jsTaskSecondary,
      cacheBustTask,
      browserSyncReload
    )
  );
  watch('src/assets/images/*', series(imageminTask, browserSyncReload));
}

exports.default = series(
  cssTask,
  jsTaskMain,
  jsTaskSecondary,
  cacheBustTask,
  browserSyncServe,
  watchTask
);

exports.prod = series(
  htmlTask_PROD,
  assetsTask,
  imageminTask,
  svgoTask,
  cssTask_PROD,
  jsTask_PROD,
  cacheBustTask
);
