var del = require('del');
var gulp = require('gulp');
var mergeStream = require('merge-stream');
var runSequence = require('run-sequence');
var tasks = require('./gulptasks');


// Config ----------------------------------------------------------------------
var jsOpts = {
  watch: 'src/javascripts/**/*.js',
  entries: ['./src/javascripts/app.js'],
  extensions: ['.js'],
  outFile: 'app.js',
  outPath: './dist/assets/js',
  lint: ['./src/javascripts/**/*.js', '!./src/javascripts/vendor/*']
};

var sassOpts = {
  watch: 'src/stylesheets/**/*.{sass,scss}',
  targets: [
    {
      source: './src/stylesheets/app.sass',
      outFile: 'app.css',
      outPath: './dist/assets/css'
    },
    {
      source: './src/stylesheets/main.sass',
      outFile: 'main.css',
      outPath: './dist/assets/css'
    }
  ]
};


// JavaScript tasks-------------------------------------------------------------
gulp.task('compile:js', function() {
  return tasks.compileJS(jsOpts);
});

gulp.task('lint:js', function() {
  return tasks.lintJS(jsOpts.lint);
});

gulp.task('build:js', ['set:noWatch'], function() {
  return new Promise(function(res) {
    return runSequence('lint:js', 'test:js', 'compile:js', res);
  });
});

gulp.task('watch:js', ['set:watch', 'compile:js'], function() {
  return gulp.watch(jsOpts.watch, ['lint:js']);
});

gulp.task('minify:js', function() {
  return tasks.minify(jsOpts, 'js');
});


// Sass tasks ------------------------------------------------------------------
gulp.task('compile:sass', function() {
  var stream = mergeStream();

  sassOpts.targets.forEach(function(t) {
    var s = tasks.compileSass(t);
    stream.add(s);
  });

  return stream;
});

gulp.task('watch:sass', ['set:watch', 'compile:sass'], function() {
  return gulp.watch(sassOpts.watch, ['compile:sass']);
});

gulp.task('minify:sass', function() {
  var stream = mergeStream();

  sassOpts.targets.forEach(function(t) {
    var s = tasks.minify(t, 'css');
    stream.add(s);
  });

  return stream;
});


// General tasks ---------------------------------------------------------------
gulp.task('set:watch', function() {
  global.watch = true;
});

gulp.task('set:noWatch', function() {
  global.watch = false;
});

gulp.task('server:start', function() {
  return tasks.startServer();
});

gulp.task('set:env:development', function() {
  process.env.NODE_ENV = 'development';
});

gulp.task('set:env:production', function() {
  process.env.NODE_ENV = 'production';
});

gulp.task('clean', function() {
  return del(['dist/**', '!dist']);
});

gulp.task('clean:unminified', function() {
  var files = [jsOpts.outPath + '/' + jsOpts.outFile];

  sassOpts.targets.forEach(function(t) {
    files.push(t.outPath + '/' + t.outFile);
  });

  return del(files);
});


// -----------------------------------------------------------------------------
gulp.task('watch', ['set:env:development'], function() {
  return runSequence('clean', 'server:start', ['watch:sass', 'watch:js']);
});

gulp.task('build', ['set:env:production'], function() {
  return new Promise(function(res) {
    return runSequence(
      'clean',
      ['compile:sass', 'build:js'],
      ['minify:sass', 'minify:js'],
      'clean:unminified',
      res
    );
  });
});

gulp.task('default', ['watch']);
