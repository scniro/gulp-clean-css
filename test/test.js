var chai = require('chai');
var expect = chai.expect;
var cleanCSS = require('..');
var gulp = require('gulp');
var File = require('vinyl');
var buffer = require('vinyl-buffer')

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
});