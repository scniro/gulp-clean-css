var chai = require('chai');
var expect = chai.expect;
var cleanCSS = require('./../index.js');
var gulp = require('gulp');
var File = require('vinyl');

chai.should();

describe('gulp-clean-css: init', function () {
    it('should return the gulp-clean-css object: required export', function () {
        expect(cleanCSS).to.be.function;
    });
});

describe('gulp-clean-css: streaming', function () {

    it('should allow the file through', function (done) {
        var i = 0;

        gulp.src('test/fixtures/test.css')
            .pipe(cleanCSS())
            .pipe(gulp.dest('test/expected'))
            .on('data', function (newFile) {
                i += 1;
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
            .pipe(gulp.dest('test/expected'))
            .on('data', function (newFile) {
                expect(newFile.contents).to.exist;
                expect(newFile.contents.toString()).to.equal(mockFile.contents.toString())
                done();
            });
    });
});