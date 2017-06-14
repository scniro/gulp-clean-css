const buffer = require('vinyl-buffer');
const chai = require('chai');
const cleanCSS = require('..');
const concat = require('gulp-concat');
const del = require('del');
const expect = chai.expect;
const File = require('vinyl');
const gulp = require('gulp');
const gulpSass = require('gulp-sass');
const rename = require('gulp-rename');
const sourcemaps = require('gulp-sourcemaps');
const vfsFake = require('vinyl-fs-fake');

chai.should();
chai.use(require('chai-string'));

describe('gulp-clean-css: init', function () {

  it('should return the gulp-clean-css object: required export', function () {
    expect(cleanCSS).to.exist;
  });
});

describe('gulp-clean-css: base functionality', function () {

  it('should play nicely with other plugins: gulp-sass: before', function (done) {
    var i = 0;

    gulp.src(['test/fixtures/**/*.scss', '!test/fixtures/empty/**', '!test/fixtures/sourcemaps-load/**'])
      .pipe(gulpSass())
      .pipe(cleanCSS())
      .pipe(rename({
        suffix: '.generated',
      }))
      .pipe(gulp.dest('test/fixtures/'))
      .on('data', function (file) {
        i += 1;
      })
      .once('end', function () {
        i.should.equal(3);
        done();
      });
  });

  it('should allow the file through', function (done) {
    var i = 0;

    gulp.src('test/fixtures/test.css')
      .pipe(cleanCSS())
      .on('data', function (file) {
        i += 1;
      })
      .once('end', function () {
        i.should.equal(1);
        done();
      });
  });

  it('should allow the file through:empty file, pipe dest', function (done) {
    var i = 0;

    gulp.src('test/fixtures/empty/**/*.scss')
      .pipe(gulpSass())
      .pipe(cleanCSS())
      .pipe(rename({
        suffix: '.generated',
      }))
      .pipe(gulp.dest(function (file) {
        return file.base + '/empty-parsed';
      }))
      .on('data', function (file) {
        i += 1;
      })
      .once('end', function () {
        i.should.equal(3);
        done();
      });
  });

  it('should produce the expected file', function (done) {

    var mockFile = new File({
      cwd: '/',
      base: '/test/',
      path: '/test/expected.test.css',
      contents: new Buffer('p{text-align:center;color:green}')
    });

    gulp.src('test/fixtures/test.css')
      .pipe(cleanCSS())
      .on('data', function (file) {
        file.contents.should.exist && expect(file.contents.toString()).to.equal(mockFile.contents.toString());
        done();
      });
  });

  it('should minify the css: empty file, no `file.contents`', function (done) {

    var i = 0;

    var mockFile = new File({
      cwd: '/',
      base: '/test/',
      path: '/test/expected.test.css',
      contents: undefined
    });

    vfsFake.src(mockFile)
      .pipe(cleanCSS())
      .on('data', function (file) {
        i += 1;
      })
      .once('end', function () {
        i.should.equal(1);
        done();
      });
  });

  it('should invoke optional callback with details specified in options: debug', function (done) {
    gulp.src('test/fixtures/test.css')
      .pipe(cleanCSS({debug: true}, function (details) {
        details.stats.should.exist &&
        details.stats.originalSize.should.exist &&
        details.stats.minifiedSize.should.exist;
      }))
      .on('data', function (file) {
        done();
      });
  });

  it('should invoke optional callback with out options object supplied: return object hash', function (done) {
    gulp.src('test/fixtures/test.css')
      .pipe(cleanCSS(function (details) {
        details.stats.should.exist &&
        expect(details).to.have.ownProperty('stats') &&
        expect(details).to.have.ownProperty('errors') &&
        expect(details).to.have.ownProperty('warnings') &&
        expect(details).to.not.have.ownProperty('sourceMap');
      }))
      .on('data', function (file) {
        done();
      });
  });

  it('should invoke optional callback without options object supplied: return object hash with sourceMap: true; return correct hash', function (done) {
    gulp.src('test/fixtures/test.css')
      .pipe(cleanCSS({sourceMap: true}, function (details) {
        details.stats.should.exist &&
        expect(details).have.ownProperty('sourceMap');
      }))
      .on('data', function (file) {
        done();
      });
  });

  it('should invoke optional callback with file details returned', function (done) {

    var expected = 'test.css'

    gulp.src('test/fixtures/test.css')
      .pipe(cleanCSS(function (details) {
        details.name.should.equal(expected)
      }))
      .on('data', function (file) {
        done();
      });
  });

  it('should write sourcemaps', function (done) {

    var i = 0;

    gulp.src(['test/fixtures/sourcemaps/**/*.css', '!test/fixtures/sourcemaps/**/*.generated.css'])
      .pipe(sourcemaps.init())
      .pipe(concat('sourcemapped.css'))
      .pipe(cleanCSS())
      .pipe(rename({
        suffix: '.generated',
      }))
      .on('data', function (file) {
        i += 1;
      })
      .pipe(sourcemaps.write())
      .pipe(gulp.dest(function (file) {
        return file.base;
      }))
      .once('end', function () {
        i.should.equal(1);
        done();
      });
  });

  it('should write sourcemaps, worrectly map output', function (done) {

    var i = 0;

    gulp.src('test/fixtures/sourcemaps-load/scss/test-sass.scss')
      .pipe(sourcemaps.init())
      .pipe(gulpSass())
      .pipe(sourcemaps.init({loadMaps: true}))
      .pipe(cleanCSS({sourceMapInlineSources: true}))
      .on('data', function (file) {
        i += 1;
      })
      .pipe(rename({
        suffix: '.min'
      }))
      .pipe(sourcemaps.write())
      .pipe(gulp.dest('test/fixtures/sourcemaps-load/min'))
      .once('end', function () {
        i.should.equal(1); // todo inspect mapping here
        done();
      });
  });

  it('should return a warning for improper syntax', function (done) {

    var i = 0;

    var css = new File({
      path: './fixtures/test.css',
      contents: new Buffer('body{color:red')
    });

    vfsFake.src(css)
      .pipe(cleanCSS({debug: true}, function (details) {
        expect(details.warnings).to.exist &&
        expect(details.warnings.length).to.equal(1) &&
        expect(details.warnings[0]).to.equal('Missing \'}\' at fixtures/test.css:1:14.');
      }))
      .on('data', function (file) {
        i += 1;
      })
      .once('end', function () {
        i.should.equal(1);
        done();
      });
  });

  it('should invoke a plugin error: streaming not supported', function (done) {

    gulp.src('test/fixtures/test.css', {buffer: false})
      .pipe(cleanCSS()
        .on('error', function (err) {
          expect(err.message).to.equal('Streaming not supported!')
          done();
        }));
  });

  it('should return a clean-css error', function (done) {

    var css = new File({
      path: '/',
      contents: new Buffer('@import url(/some/fake/file);')
    });

    vfsFake.src(css)
      .pipe(cleanCSS())
      .on('error', function (err) {
        expect(err).to.exist;
        expect(err).to.equal('Ignoring local @import of "/some/fake/file" as resource is missing.');
        done();
      });
  });
});

describe('gulp-clean-css: rebase', function () {

  it('should not rebase files by default - do not resolve relative files', function (done) {

    gulp.src(['test/fixtures/rebasing/subdir/insub.css'])
      .pipe(cleanCSS({rebase: false}))
      .on('data', function (file) {

        let expected = `
        p.insub_same{background:url(insub.png)}
        p.insub_child{background:url(child/child.png)}
        p.insub_parent{background:url(../parent.png)}
        p.insub_other{background:url(../othersub/inother.png)}
        p.insub_absolute{background:url(/inroot.png)}`;

        let actual = file.contents.toString();

        expect(actual).to.equalIgnoreSpaces(expected)
      })
      .once('end', done);
  });

  it('should by rebase files with target specified', function (done) {

    gulp.src(['test/fixtures/rebasing/subdir/insub.css'])
      .pipe(cleanCSS({rebaseTo: 'test'}))
      .on('data', function (file) {

        let expected = `
        p.insub_same{background:url(fixtures/rebasing/subdir/insub.png)}
        p.insub_child{background:url(fixtures/rebasing/subdir/child/child.png)}
        p.insub_parent{background:url(fixtures/rebasing/parent.png)}
        p.insub_other{background:url(fixtures/rebasing/othersub/inother.png)}
        p.insub_absolute{background:url(/inroot.png)}`;

        let actual = file.contents.toString();

        expect(actual).to.equalIgnoreSpaces(expected);
      })
      .once('end', done);
  });

  it('should rebase to current relative file location - relative imports are resolved like in the browser', function (done) {

    gulp.src(['test/fixtures/rebasing/subdir/import.css'])
      .pipe(cleanCSS())
      .on('data', function (file) {

        let expected = `
        p.imported_nested{background:url(../otherdir/nestedsub/nested.png)}
        p.imported_same{background:url(../otherdir/imported.png)}
        p.imported_parent{background:url(../parent.png)}
        p.imported_other{background:url(../othersub/inother.png)}
        p.imported_absolute{background:url(/inroot.png)}
        p.insub_same{background:url(insub.png)}
        p.insub_child{background:url(child/child.png)}
        p.insub_parent{background:url(../parent.png)}
        p.insub_other{background:url(../othersub/inother.png)}
        p.insub_absolute{background:url(/inroot.png)}
        p.import{background:url(import.png)}`;

        let actual = file.contents.toString();

        expect(actual).to.equalIgnoreSpaces(expected)
      })
      .once('end', done);
  });
});
