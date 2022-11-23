const { dest, parallel, series, src, watch } = require('gulp');
const autoprefixer = require('autoprefixer');
const browsersync = require('browser-sync').create();
const concat = require('gulp-concat');
const combinemq = require('postcss-combine-media-query');
const cssnano = require('cssnano');
const imagemin = require('gulp-imagemin');
const postcss = require('gulp-postcss');
const replace = require('gulp-replace');
const sass = require('gulp-sass')(require('sass'));
const svgo = require('gulp-svgo');
const uglify = require('gulp-uglify');
const gulp = require('gulp');
const browserify = require('browserify');
const source = require('vinyl-source-stream');
const tsify = require('tsify');
const sourcemaps = require('gulp-sourcemaps');
const buffer = require('vinyl-buffer');
const paths = {
  pages: ['src/*.html'],
};

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

// sass
//! don't forget to change css2 to css
function scssTask() {
  return src('src/sass/main.scss', { sourcemaps: true })
    .pipe(sass().on('error', sass.logError))
    .pipe(postcss([autoprefixer()]))
    .pipe(dest('src/css2', { sourcemaps: '.' }));
}

function scssTask_PROD() {
  return src('src/sass/main.scss', { sourcemaps: true })
    .pipe(sass().on('error', sass.logError))
    .pipe(postcss([autoprefixer(), combinemq(), cssnano()]))
    .pipe(dest('dist/src/css2', { sourcemaps: '.' }));
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
      '!src/js/__tests__/**',
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

// ts
//! don't forget to change js2 to js
function typescriptTask() {
  return browserify({
    basedir: '.',
    debug: true,
    entries: ['src/ts/main.ts'],
    cache: {},
    packageCache: {},
  })
    .plugin(tsify)
    .transform('babelify', {
      presets: ['es2015'],
      extensions: ['.ts'],
    })
    .bundle()
    .pipe(source('bundle.js'))
    .pipe(buffer())
    .pipe(sourcemaps.init({ loadMaps: true }))
    .pipe(sourcemaps.write('./'))
    .pipe(dest('src/js2'));
}

function typescriptTask_PROD() {
  return browserify({
    basedir: '.',
    debug: true,
    entries: ['src/ts/main.ts'],
    cache: {},
    packageCache: {},
  })
    .plugin(tsify)
    .transform('babelify', {
      presets: ['es2015'],
      extensions: ['.ts'],
    })
    .bundle()
    .pipe(source('bundle.js'))
    .pipe(buffer())
    .pipe(sourcemaps.init({ loadMaps: true }))
    .pipe(sourcemaps.write('./'))
    .pipe(dest('dist/src/js2'));
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
//! don't forget to change watch task based on the template
function watchTask() {
  watch('index.html', browserSyncReload);

  watch(
    [
      'src/css/**/*.css',
      'src/sass/**/*.scss',
      'src/js/**/*.js',
      'src/ts/**/*.ts',
      '!src/js/tests/*.js',
      '!src/ts/tests/*.ts',
    ],
    series(
      cssTask,
      scssTask,
      jsTaskMain,
      jsTaskSecondary,
      typescriptTask,
      cacheBustTask,
      browserSyncReload
    )
  );
  watch('src/assets/images/*', series(imageminTask, browserSyncReload));
}

// HTML CSS JAVASCRIPT
// exports.default = series(
//   cssTask,
//   jsTaskMain,
//   jsTaskSecondary,
//   cacheBustTask,
//   browserSyncServe,
//   watchTask
// );

// exports.prod = series(
//   htmlTask_PROD,
//   assetsTask,
//   imageminTask,
//   svgoTask,
//   cssTask_PROD,
//   jsTask_PROD,
//   cacheBustTask
// );

// HTML SASS JAVASCRIPT
// exports.default = series(
//   scssTask,
//   jsTaskMain,
//   jsTaskSecondary,
//   cacheBustTask,
//   browserSyncServe,
//   watchTask
// );

// exports.prod = series(
//   htmlTask_PROD,
//   assetsTask,
//   imageminTask,
//   svgoTask,
//   scssTask_PROD,
//   jsTask_PROD,
//   cacheBustTask
// );

// HTML CSS TYPESCRIPT
// exports.default = series(
//   cssTask,
//   typescriptTask,
//   cacheBustTask,
//   browserSyncServe,
//   watchTask
// );

// exports.prod = series(
//   htmlTask_PROD,
//   assetsTask,
//   imageminTask,
//   svgoTask,
//   cssTask_PROD,
//   typescriptTask_PROD,
//   cacheBustTask
// );

// HTML SASS TYPESCRIPT
exports.default = series(
  scssTask,
  typescriptTask,
  cacheBustTask,
  browserSyncServe,
  watchTask
);

exports.prod = series(
  htmlTask_PROD,
  assetsTask,
  imageminTask,
  svgoTask,
  scssTask_PROD,
  typescriptTask_PROD,
  cacheBustTask
);
