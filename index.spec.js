const chai = require('chai');
const cleanCSS = require('.');
const concat = require('gulp-concat');
const File = require('vinyl');
const gulp = require('gulp');
const gulpSass = require('gulp-sass')(require('sass'));
const rename = require('gulp-rename');
const sourcemaps = require('gulp-sourcemaps');

const expect = chai.expect;

chai.should();
chai.use(require('chai-string'));

describe('gulp-clean-css: init', () => {

  it('should return the gulp-clean-css object: required export', () => {
    expect(cleanCSS).to.exist;
  });
});

describe('gulp-clean-css: base functionality', () => {

  it('should play nicely with other plugins: gulp-sass: before', done => {

    let i = 0;

    gulp.src(['test/fixtures/**/*.scss', '!test/fixtures/empty/**', '!test/fixtures/sourcemaps-load/**'])
      .pipe(gulpSass())
      .pipe(cleanCSS())
      .pipe(rename({
        suffix: '.generated',
      }))
      .pipe(gulp.dest('test/fixtures/'))
      .on('data', file => {
        i += 1;
      })
      .once('end', () => {
        i.should.equal(3);
        done();
      });
  });

  it('should allow the file through', done => {

    let i = 0;

    gulp.src('test/fixtures/test.css')
      .pipe(cleanCSS())
      .on('data', file => {
        i += 1;
      })
      .once('end', () => {
        i.should.equal(1);
        done();
      });
  });

  it('should allow the file through: no options specified', done => {

    let i = 0;

    gulp.src('test/fixtures/test.css')
      .pipe(cleanCSS(details => {
        console.log('hi');
      }))
      .on('data', file => {
        i += 1;
      })
      .once('end', () => {
        i.should.equal(1);
        done();
      });
  });

  it('should allow empty files through', done => {

    let i = 0;

    gulp.src('test/fixtures/empty.css')
      .pipe(cleanCSS())
      .on('data', file => {
        i += 1;
      })
      .once('end', () => {
        i.should.equal(1);
        done();
      });
  });

  it('should allow the file through:empty file, pipe dest', done => {

    let i = 0;

    gulp.src('test/fixtures/empty/**/*.scss')
      .pipe(gulpSass())
      .pipe(cleanCSS())
      .pipe(rename({
        suffix: '.generated',
      }))
      .pipe(gulp.dest(file => `${file.base}/empty-parsed`))
      .on('data', file => {
        i += 1;
      })
      .once('end', () => {
        i.should.equal(3);
        done();
      });
  });

  it('should produce the expected file', done => {

    let mockFile = new File({
      cwd: '/',
      base: '/test/',
      path: '/test/expected.test.css',
      contents: new Buffer.from('p{text-align:center;color:green}')
    });

    gulp.src('test/fixtures/test.css')
      .pipe(cleanCSS())
      .on('data', file => {
        file.contents.should.exist && expect(file.contents.toString()).to.equal(mockFile.contents.toString());
        done();
      });
  });

  it('should invoke optional callback with details specified in options: debug', done => {
    gulp.src('test/fixtures/test.css')
      .pipe(cleanCSS({debug: true}, (details) => {
        details.stats.should.exist &&
        details.stats.originalSize.should.exist &&
        details.stats.minifiedSize.should.exist;
      }))
      .on('data', file => {
        done();
      });
  });

  it('should invoke optional callback with out options object supplied: return object hash', done => {

    let called = false;

    gulp.src('test/fixtures/test.css')
      .pipe(cleanCSS({}, details => {
        called = true;
        details.stats.should.exist &&
        expect(details).to.have.ownProperty('stats') &&
        expect(details).to.have.ownProperty('errors') &&
        expect(details).to.have.ownProperty('warnings') &&
        expect(details).to.not.have.ownProperty('sourceMap');
      }))
      .on('data', (file) => {
        //
      })
      .once('end', () => {
        expect(called).to.be.true;
        done();
      })
  });

  it('should invoke optional callback without options object supplied: return object hash with sourceMap: true; return correct hash', done => {
    gulp.src('test/fixtures/test.css')
      .pipe(cleanCSS({sourceMap: true}, details => {
        details.stats.should.exist &&
        expect(details).have.ownProperty('sourceMap');
      }))
      .on('data', file => {
        done();
      });
  });

  it('should invoke optional callback with file details returned', done => {

    let expected = 'test.css';

    gulp.src('test/fixtures/test.css')
      .pipe(cleanCSS(details => {
        details.name.should.containIgnoreCase(expected)
      }))
      .on('data', file => {
        done();
      });
  });

  it('should write sourcemaps', done => {

    let i = 0;

    gulp.src(['test/fixtures/sourcemaps/**/*.css', '!test/fixtures/sourcemaps/**/*.generated.css'])
      .pipe(sourcemaps.init())
      .pipe(concat('sourcemapped.css'))
      .pipe(cleanCSS())
      .pipe(rename({
        suffix: '.generated',
      }))
      .on('data', file => {
        i += 1;
      })
      .pipe(sourcemaps.write())
      .pipe(gulp.dest(file => file.base))
      .once('end', () => {
        i.should.equal(1);
        done();
      });
  });

  it('should write sourcemaps, worrectly map output', done => {

    let i = 0;

    gulp.src('test/fixtures/sourcemaps-load/scss/test-sass.scss')
      .pipe(sourcemaps.init())
      .pipe(gulpSass())
      .pipe(sourcemaps.init({loadMaps: true}))
      .pipe(cleanCSS({sourceMapInlineSources: true}))
      .on('data', file => {
        i += 1;
      })
      .pipe(rename({
        suffix: '.min'
      }))
      .pipe(sourcemaps.write())
      .pipe(gulp.dest('test/fixtures/sourcemaps-load/min'))
      .once('end', () => {
        i.should.equal(1); // todo inspect mapping here
        done();
      });
  });

  it('should invoke a plugin error: streaming not supported', done => {

    gulp.src('test/fixtures/test.css', {buffer: false})
      .pipe(cleanCSS()
        .on('error', err => {
          expect(err.message).to.equal('Streaming not supported!');
          done();
        }));
  });

  it('should handle malformed CSS', done => {
    let i = 0;

    gulp.src('test/fixtures/malformed.css')
      .pipe(cleanCSS())
      .on('error', e => {
        expect(e).to.exist;
        done();
      })
  });

  it('should not process empty directories or files', done => {

    gulp.src('./test/fixtures/very-empty/**')
      .pipe(cleanCSS({}, detail => {
        expect(detail.errors).to.be.empty;
      }))
      .on('data', file => {
        //
      })
      .on('end', () => {
        done();
      });
  })

  it('should write sourcemaps, correct source path', done => {
    let maps = {};
    gulp.src(['test/fixtures/sourcemaps-import/styles/main.css'], {base: 'test/fixtures/sourcemaps-import/styles'})
      .pipe(sourcemaps.init())
      .pipe(cleanCSS())
      .pipe(sourcemaps.mapSources(function (sourcePath, file) {
        maps[sourcePath] = true;
        return sourcePath;
      }))
      .pipe(sourcemaps.write('./', {sourceRoot: '/'}))
      .pipe(gulp.dest('test/fixtures/sourcemaps-import'))
      .once('end', () => {
        maps['main.css'].should.be.true;
        maps['partial.css'].should.be.true;
        done();
      });
  });
});

describe('gulp-clean-css: rebase', () => {

  it('should not rebase files by default - do not resolve relative files', done => {

    gulp.src(['test/fixtures/rebasing/subdir/insub.css'])
      .pipe(cleanCSS({rebase: false}))
      .on('data', file => {

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

  it('should by rebase files with target specified', done => {

    gulp.src(['test/fixtures/rebasing/subdir/insub.css'])
      .pipe(cleanCSS({rebaseTo: 'test'}))
      .on('data', file => {

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

  it('should rebase to current relative file location - relative imports are resolved like in the browser', done => {

    gulp.src(['test/fixtures/rebasing/subdir/import.css'])
      .pipe(cleanCSS())
      .on('data', file => {

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
