var buffer = require('vinyl-buffer');
var chai = require('chai');
var cleanCSS = require('..');
var concat = require('gulp-concat');
var del = require('del');
var expect = chai.expect;
var File = require('vinyl');
var gulp = require('gulp');
var rename = require('gulp-rename');
var sourcemaps = require('gulp-sourcemaps');

chai.should();

describe('gulp-clean-css: init', function () {

    it('should return the gulp-clean-css object: required export', function () {
        expect(cleanCSS).to.be.function;
    });
});

describe('gulp-clean-css: base functionality', function () {

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

    it('should allow the file through: streaming', function (done) {
        var i = 0;

        gulp.src('test/fixtures/test.css', {buffer: false})
            .pipe(cleanCSS())
            .on('data', function (file) {
                i += 1;
                expect(file.isStream()).to.be.true;
            })
            .once('end', function () {
                i.should.equal(1);
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

    it('should produce the expected file: streaming', function (done) {
        var mockFile = new File({
            cwd: '/',
            base: '/test/',
            path: '/test/expected.test.css',
            contents: new Buffer('p{text-align:center;color:green}')
        });

        gulp.src('test/fixtures/test.css', {buffer: false})
            .pipe(cleanCSS())
            .pipe(buffer())
            .on('data', function (file) {
                file.contents.should.exist && expect(file.contents.toString()).to.equal(mockFile.contents.toString());
                done();
            });
    });

    it('should invoke optional callback with details specified in options: debug', function (done) {
        gulp.src('test/fixtures/test.css')
            .pipe(cleanCSS({debug: true}, function (details) {
                details.stats.should.exist &&
                details.stats.originalSize.should.exist
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

    it('should write sourcemaps', function (done) {

        del.sync('test/fixtures/sourcemaps/expected/once.min.css');

        gulp.src('test/fixtures/sourcemaps/*.css')
            .pipe(sourcemaps.init())
            .pipe(concat('once.min.css'))
            .pipe(cleanCSS())
            .pipe(sourcemaps.write())
            .pipe(gulp.dest('test/fixtures/sourcemaps/expected'))
            .once('end', function () {
                done();
            });
    });

    it('should write sourcemaps - two passes - loadMaps: true', function (done) {

        del.sync(['test/fixtures/sourcemaps/expected/twice.css', 'test/fixtures/sourcemaps/expected/twice.min.css']);

        function post() {
            gulp.src('test/fixtures/sourcemaps/expected/twice.css')
                .pipe(sourcemaps.init({loadMaps: true}))
                .pipe(cleanCSS())
                .pipe(sourcemaps.write())
                .pipe(rename({
                    suffix: '.min'
                }))
                .pipe(gulp.dest('test/fixtures/sourcemaps/expected'))
                .once('end', function () {
                    done();
                });
        }

        gulp.src('test/fixtures/sourcemaps/*.css')
            .pipe(sourcemaps.init())
            .pipe(concat('twice.css'))
            .pipe(sourcemaps.write())
            .pipe(gulp.dest('test/fixtures/sourcemaps/expected'))
            .once('end', function () {
                post();
            });
    });
});