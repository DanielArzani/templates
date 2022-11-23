const { dest, parallel, series, src, watch } = require('gulp');
const autoprefixer = require('autoprefixer');
const browsersync = require('browser-sync').create();
const concat = require('gulp-concat');
const cssnano = require('cssnano');
const imagemin = require('gulp-imagemin');
const postcss = require('gulp-postcss');
const replace = require('gulp-replace');
const svgo = require('gulp-svgo');
const browserify = require('browserify');
const source = require('vinyl-source-stream');
const tsify = require('tsify');
const sourcemaps = require('gulp-sourcemaps');
const buffer = require('vinyl-buffer');

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

// ts
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
    .pipe(dest('src/js'));
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
    .pipe(dest('dist/src/js'));
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
    ['src/css/**/*.css', 'src/ts/**/*.ts', '!src/ts/tests/*.ts'],
    series(cssTask, typescriptTask, cacheBustTask, browserSyncReload)
  );
  watch('src/assets/images/*', series(imageminTask, browserSyncReload));
}

// HTML CSS TYPESCRIPT
exports.default = series(
  cssTask,
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
  cssTask_PROD,
  typescriptTask_PROD,
  cacheBustTask
);
