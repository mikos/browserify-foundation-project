var autoprefixer = require('autoprefixer');
var browserify = require('browserify');
var eslint = require('gulp-eslint');
var gulp = require('gulp');
var cleanCSS = require('gulp-clean-css');
var gulpIf = require('gulp-if');
var livereload = require('gulp-livereload');
var postcss = require('gulp-postcss');
var rename = require('gulp-rename');
var sass = require('gulp-sass');
var sourcemaps = require('gulp-sourcemaps');
var uglify = require('gulp-uglify');
var gutil = require('gulp-util');
var _ = require('lodash');
var stringify = require('stringify');
var source = require('vinyl-source-stream');
var watchify = require('watchify');

function createBundle(opts) {
  var bundle = browserify(_.assign({}, watchify.args, _.pick(opts, ['entries', 'extensions'])));

  bundle = global.watch ? watchify(bundle) : bundle;
  bundle.transform(stringify({
    extensions: ['.html'],
  }));

  return bundle;
}

function buildBundle(bundle, opts) {
  return bundle.bundle()
    .on('error', gutil.log)
    .pipe(source(opts.outFile))
    .pipe(gulp.dest(opts.outPath))
    .pipe(gulpIf(global.watch, livereload()));
}

function startServer(opts) {
  return livereload.listen();
}

function compileJS(opts) {
  var bundle = createBundle(opts);

  if (global.watch) {
    bundle.on('update', function () {
      return buildBundle(bundle, opts);
    });
    bundle.on('log', gutil.log);
  }

  return buildBundle(bundle, opts);
}

function lintJS(path) {
  return gulp.src(path)
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failOnError().on('error', function (e) {
      var msg = e.name + ': ' + e.message;
      msg += ' on line ' + e.lineNumber + ' in ' + error.fileName;

      gutil.log(msg);
    }));
}

function compileSass(opts) {
  return gulp.src(opts.source)
    .pipe(gulpIf(global.watch, sourcemaps.init()))
    .pipe(sass().on('error', sass.logError))
    .pipe(postcss([autoprefixer({ browsers: ['last 3 versions'] })]))
    .pipe(gulpIf(global.watch, sourcemaps.write()))
    .pipe(rename(opts.outFile))
    .pipe(gulp.dest(opts.outPath))
    .pipe(gulpIf(global.watch, livereload()));
}

function minify(opts, type) {
  return gulp.src(opts.outPath + '/' + opts.outFile)
    .pipe(gulpIf(type === 'js', uglify()))
    .pipe(gulpIf(type === 'css', cleanCss()))
    .pipe(rename({ suffix: '.min' }))
    .pipe(gulp.dest(opts.outPath));
}

exports.startServer = startServer;
exports.compileJS = compileJS;
exports.lintJS = lintJS;
exports.compileSass = compileSass;
exports.minify = minify;
