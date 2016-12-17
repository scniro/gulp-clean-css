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

describe('gulp-clean-css: init', function () {

  it('should return the gulp-clean-css object: required export', function () {
    expect(cleanCSS).to.be.function;
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
        expect(details.warnings[0]).to.equal('Missing \'}\' after \'color:red\'. Ignoring.');
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
        expect(err).to.equal('Broken @import declaration of "/some/fake/file"');
        done();
      });
  });
});

describe('gulp-clean-css: rebase', function () {

  it('should not rebase files by default', function (done) {

    // CLI: cleancss test/fixtures/rebasing/subdir/insub.css
    gulp.src(['test/fixtures/rebasing/subdir/insub.css'])
      .pipe(cleanCSS())
      .on('data', function (file) {
        expect(file.contents.toString()).to.equal(
          'p.insub_same{background:url(insub.png)}' +
          'p.insub_parent{background:url(../parent.png)}' +
          'p.insub_other{background:url(../othersub/inother.png)}' +
          'p.insub_absolute{background:url(/inroot.png)}'
        );
      })
      .once('end', function () {
        done();
      });
  });

  // CLI: cleancss test/fixtures/rebasing/subdir/insub.css -o test/fixtures/rebasing/min.generated.css
  it('should by rebase files with target specified', function (done) {
    gulp.src(['test/fixtures/rebasing/subdir/insub.css'])
      .pipe(cleanCSS({target: 'test/fixtures/rebasing/min.generated.css'}))
      .on('data', function (file) {
        expect(file.contents.toString()).to.equal(
          'p.insub_same{background:url(subdir/insub.png)}' +
          'p.insub_parent{background:url(parent.png)}' +
          'p.insub_other{background:url(othersub/inother.png)}' +
          'p.insub_absolute{background:url(/inroot.png)}'
        );
      })
      .once('end', function () {
        done();
      });
  });

  // CLI: cleancss test/fixtures/rebasing/subdir/insub.css -o test/fixtures/rebasing/subdir/min.generated.css
  it('should by rebase files with target in subdir specified', function (done) {
    gulp.src(['test/fixtures/rebasing/subdir/insub.css'])
      .pipe(cleanCSS({target: 'test/fixtures/rebasing/subdir/min.generated.css'}))
      .on('data', function (file) {
        expect(file.contents.toString()).to.equal(
          'p.insub_same{background:url(insub.png)}' +
          'p.insub_parent{background:url(../parent.png)}' +
          'p.insub_other{background:url(../othersub/inother.png)}' +
          'p.insub_absolute{background:url(/inroot.png)}'
        );
      })
      .once('end', function () {
        done();
      });
  });

  // CLI: cleancss test/fixtures/rebasing/subdir/insub.css --root test/fixtures/rebasing/
  it('should rebase files with root specified', function (done) {
    gulp.src(['test/fixtures/rebasing/subdir/insub.css'])
      .pipe(cleanCSS({root: 'test/fixtures/rebasing/'}))
      .on('data', function (file) {
        expect(file.contents.toString()).to.equal(
          'p.insub_same{background:url(/subdir/insub.png)}' +
          'p.insub_parent{background:url(/parent.png)}' +
          'p.insub_other{background:url(/othersub/inother.png)}' +
          'p.insub_absolute{background:url(/inroot.png)}'
        );
      })
      .once('end', function () {
        done();
      })
  });

  // CLI: cleancss test/fixtures/rebasing/subdir/insub.css --root test/fixtures/rebasing/ -o test/fixtures/rebasing/subdir/min.generated.css
  it('should rebase files with root and target specified', function (done) {
    gulp.src(['test/fixtures/rebasing/subdir/insub.css'])
      .pipe(cleanCSS({
        root: 'test/fixtures/rebasing/',
        target: 'test/fixtures/rebasing/subdir/min.generated.css'
      }))
      .on('data', function (file) {
        expect(file.contents.toString()).to.equal(
          'p.insub_same{background:url(/subdir/insub.png)}' +
          'p.insub_parent{background:url(/parent.png)}' +
          'p.insub_other{background:url(/othersub/inother.png)}' +
          'p.insub_absolute{background:url(/inroot.png)}'
        );
      })
      .once('end', function () {
        done();
      })
  });

  // CLI: cleancss test/fixtures/rebasing/subdir/import.css
  it('should resolve imports correctly', function (done) {
    gulp.src(['test/fixtures/rebasing/subdir/import.css'])
      .pipe(cleanCSS())
      .on('data', function (file) {
        expect(file.contents.toString()).to.equal(
          'p.imported_nested{background:url(../otherdir/nestedsub/nested.png)}' +
          'p.imported_same{background:url(../otherdir/imported.png)}' +
          'p.imported_parent{background:url(../parent.png)}' +
          'p.imported_other{background:url(../othersub/inother.png)}' +
          'p.imported_absolute{background:url(/inroot.png)}' +
          'p.insub_same{background:url(insub.png)}' +
          'p.insub_parent{background:url(../parent.png)}' +
          'p.insub_other{background:url(../othersub/inother.png)}' +
          'p.insub_absolute{background:url(/inroot.png)}' +
          'p.import{background:url(import.png)}'
        );
      })
      .once('end', function () {
        done();
      })
  });

  // CLI: cleancss test/fixtures/rebasing/subdir/import.css -o test/fixtures/root.generated.css
  it('should resolve imports with target set correctly', function (done) {
    gulp.src(['test/fixtures/rebasing/subdir/import.css'])
      .pipe(cleanCSS({target: 'test/fixtures/root.generated.css'}))
      .on('data', function (file) {
        expect(file.contents.toString()).to.equal(
          'p.imported_nested{background:url(rebasing/otherdir/nestedsub/nested.png)}' +
          'p.imported_same{background:url(rebasing/otherdir/imported.png)}' +
          'p.imported_parent{background:url(rebasing/parent.png)}' +
          'p.imported_other{background:url(rebasing/othersub/inother.png)}' +
          'p.imported_absolute{background:url(/inroot.png)}' +
          'p.insub_same{background:url(rebasing/subdir/insub.png)}' +
          'p.insub_parent{background:url(rebasing/parent.png)}' +
          'p.insub_other{background:url(rebasing/othersub/inother.png)}' +
          'p.insub_absolute{background:url(/inroot.png)}' +
          'p.import{background:url(rebasing/subdir/import.png)}'
        );
      })
      .once('end', function () {
        done();
      })
  });

  // CLI: cleancss test/fixtures/rebasing/subdir/import_absolute.css --root test/fixtures/
  it('should resolve absolute imports with root set correctly', function (done) {
    gulp.src(['test/fixtures/rebasing/subdir/import_absolute.css'])
      .pipe(cleanCSS({root: 'test/fixtures/'}))
      .on('data', function (file) {
        expect(file.contents.toString()).to.equal(
          'p.imported_nested{background:url(/rebasing/otherdir/nestedsub/nested.png)}' +
          'p.imported_same{background:url(/rebasing/otherdir/imported.png)}' +
          'p.imported_parent{background:url(/rebasing/parent.png)}' +
          'p.imported_other{background:url(/rebasing/othersub/inother.png)}' +
          'p.imported_absolute{background:url(/inroot.png)}' +
          'p.insub_same{background:url(/rebasing/subdir/insub.png)}' +
          'p.insub_parent{background:url(/rebasing/parent.png)}' +
          'p.insub_other{background:url(/rebasing/othersub/inother.png)}' +
          'p.insub_absolute{background:url(/inroot.png)}' +
          'p.fromroot{background:url(/rebasing/sbudir/insubdir.png)}' +
          'p.root{background:url(/rebasing/inroot.png)}' +
          'p.import{background:url(/rebasing/subdir/import.png)}'
        );
      })
      .once('end', function () {
        done();
      })
  });

  // CLI: cleancss test/fixtures/rebasing/subdir/import_absolute.css --root test/fixtures/ -o test/fixtures/rebasing/subdir/min.generated.css
  it('should resolve imports with root and target set correctly', function (done) {
    gulp.src(['test/fixtures/rebasing/subdir/import_absolute.css'])
      .pipe(cleanCSS({root: 'test/fixtures/', target: 'test/fixtures/rebasing/subdir/min.generated.css'}))
      .on('data', function (file) {
        expect(file.contents.toString()).to.equal(
          'p.imported_nested{background:url(/rebasing/otherdir/nestedsub/nested.png)}' +
          'p.imported_same{background:url(/rebasing/otherdir/imported.png)}' +
          'p.imported_parent{background:url(/rebasing/parent.png)}' +
          'p.imported_other{background:url(/rebasing/othersub/inother.png)}' +
          'p.imported_absolute{background:url(/inroot.png)}' +
          'p.insub_same{background:url(/rebasing/subdir/insub.png)}' +
          'p.insub_parent{background:url(/rebasing/parent.png)}' +
          'p.insub_other{background:url(/rebasing/othersub/inother.png)}' +
          'p.insub_absolute{background:url(/inroot.png)}' +
          'p.fromroot{background:url(/rebasing/sbudir/insubdir.png)}' +
          'p.root{background:url(/rebasing/inroot.png)}' +
          'p.import{background:url(/rebasing/subdir/import.png)}'
        );
      })
      .once('end', function () {
        done();
      })
  });
});