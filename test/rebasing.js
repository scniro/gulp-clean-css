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

describe('gulp-clean-css: rebase', function () {

  it('should not rebase files by default', function (done) {

    // CLI: cleancss test/fixtures/rebasing/subdir/insub.css
    gulp.src(['test/fixtures/rebasing/subdir/insub.css'])
      .pipe(cleanCSS())
      .on('data', function(file) {
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
        root : 'test/fixtures/rebasing/',
        target : 'test/fixtures/rebasing/subdir/min.generated.css'
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
      .pipe(cleanCSS({root: 'test/fixtures/', target : 'test/fixtures/rebasing/subdir/min.generated.css'}))
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