# gulp-clean-css

[![Build Status](https://img.shields.io/travis/scniro/gulp-clean-css.svg?style=flat-square)](https://travis-ci.org/scniro/gulp-clean-css)
[![NPM Version](https://img.shields.io/npm/v/gulp-clean-css.svg?style=flat-square)](https://www.npmjs.com/package/gulp-clean-css)
[![Dependency Status](https://img.shields.io/david/scniro/gulp-clean-css.svg?label=deps&style=flat-square)](https://david-dm.org/scniro/gulp-clean-css)
[![devDependency Status](https://img.shields.io/david/dev/scniro/gulp-clean-css.svg?label=devDeps&style=flat-square)](https://david-dm.org/scniro/gulp-clean-css#info=devDependencies)
[![Coverage](https://img.shields.io/coveralls/scniro/gulp-clean-css.svg?style=flat-square)](https://coveralls.io/github/scniro/gulp-clean-css)
[![Climate](https://img.shields.io/codeclimate/github/scniro/gulp-clean-css.svg?label=climate&style=flat-square)](https://codeclimate.com/github/scniro/gulp-clean-css)

> [gulp](http://gulpjs.com/) plugin to minify CSS, using [clean-css](https://github.com/jakubpawlowicz/clean-css)

## Regarding Issues

This is just a simple [gulp](https://github.com/gulpjs/gulp) plugin, which means it's nothing more than a thin wrapper around `clean-css`. If it looks like you are having CSS related issues, please contact [clean-css](https://github.com/jakubpawlowicz/clean-css/issues). Only create a new issue if it looks like you're having a problem with the plugin itself.

## Install

```
npm install gulp-clean-css --save-dev
```

## API

### cleanCSS([*options*], [*callback*])

#### options

See the [`CleanCSS` options](https://github.com/jakubpawlowicz/clean-css#how-to-use-clean-css-api).

```javascript
var gulp = require('gulp');
var cleanCSS = require('gulp-clean-css');

gulp.task('minify-css', function() {
  return gulp.src('styles/*.css')
    .pipe(cleanCSS({compatibility: 'ie8'}))
    .pipe(gulp.dest('dist'));
});
```

#### callback

Useful for returning details from the underlying [`minify()`](https://github.com/jakubpawlowicz/clean-css#using-api) call. An example use case could include logging `stats` of the minified file. In addition to the default object, `gulp-clean-css` provides the file `name` and `path` for further analysis.

```javascript
var gulp = require('gulp');
var cleanCSS = require('gulp-clean-css');

gulp.task('minify-css', function() {
    return gulp.src('styles/*.css')
        .pipe(cleanCSS({debug: true}, function(details) {
            console.log(details.name + ': ' + details.stats.originalSize);
            console.log(details.name + ': ' + details.stats.minifiedSize);
        }))
        .pipe(gulp.dest('dist'));
});
```

[Source Maps](http://www.html5rocks.com/tutorials/developertools/sourcemaps/) can be generated by using [gulp-sourcemaps](https://github.com/floridoo/gulp-sourcemaps).

```javascript

var gulp = require('gulp');
var cleanCSS = require('gulp-clean-css');
var sourcemaps = require('gulp-sourcemaps');

gulp.task('minify-css', function() {
    return gulp.src('./src/*.css')
        .pipe(sourcemaps.init())
        .pipe(cleanCSS())
        .pipe(sourcemaps.write())
        .pipe(gulp.dest('dist'));
});
```

## Loading via gulp plugins

If you use `gulp-load-plugins`, you can load use it like this:

```javascript
import gulp from 'gulp';
import gulpLoadPlugins from 'gulp-load-plugins';
const $ = gulpLoadPlugins();

gulp.task('minify-css', () => {
    return gulp.src('./src/*.css')
        .pipe($.sourcemaps.init())
        .pipe($.cleanCss())
        .pipe($.sourcemaps.write())
        .pipe(gulp.dest('dist'));
});
```

## License

[MIT](./LICENSE) © 2016 [scniro](https://github.com/scniro)
