var gulp = require('gulp');
var mocha = require('gulp-mocha');
var log = require('fancy-log');
var istanbul = require('gulp-istanbul');

gulp.task('pre-test', function () {
  return gulp.src(['index.js'])
  .pipe(istanbul())
  .pipe(istanbul.hookRequire());
});

gulp.task('test', ['pre-test'], function () {
  return gulp.src('test/*.js')
  .pipe(mocha({reporter: 'dot'}))
  .pipe(istanbul.writeReports({
    includeUntested: true,
    reporters: ['lcov']
  }))
  .on('error', log);
});