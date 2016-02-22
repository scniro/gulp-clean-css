// Todo - test overhaul

var chai = require('chai');
var expect = chai.expect;
var cleanCSS = require('./../index.js');

chai.should();

describe('gulp-clean-css:init', function () {
    it('should return the gulp-clean-css object: required export', function () {
        expect(cleanCSS).to.be.function;
    })
})