'use strict';

const {createServer} = require('http');
const {EOL} = require('os');
const path = require('path');

const combine = require('stream-combiner2');
const {expect} = require('chai');
const File = require('vinyl');
const minifyCSS = require('..');
const {PluginError} = require('gulp-util');
const sourceMaps = require('gulp-sourcemaps');
const stringToStream = require('from2-string');
const stylus = require('gulp-stylus');

describe('gulp-minify-css minification', () => {
  const opts = {
    keepSpecialComments: 1,
    keepBreaks: true
  };

  it('should not modify empty files', done => {
    minifyCSS(opts)
    .on('error', done)
    .on('data', file => {
      expect(file.isNull()).to.be.equal(true);
      done();
    })
    .end(new File());
  });

  it('should not modify the original option object', done => {
    minifyCSS(opts)
    .on('error', done)
    .on('finish', () => {
      expect(opts).to.be.eql({
        keepSpecialComments: 1,
        keepBreaks: true
      });
      done();
    })
    .end(new File({contents: new Buffer('')}));
  });

  describe('in buffer mode', () => {
    it('should minify CSS files', done => {
      minifyCSS(opts)
      .on('error', done)
      .on('data', file => {
        expect(String(file.contents)).to.be.equal('/*!foo*/' + EOL + 'a{color:red}');
        done();
      })
      .end(new File({contents: new Buffer('/*!foo*//*bar*/\na { color: red; }/*!baz*/')}));
    });

    it('should emit an error when the CSS is corrupt', done => {
      minifyCSS()
      .on('error', err => {
        expect(err).to.be.instanceOf(PluginError);
        expect(err.fileName).to.be.equal(path.join(__dirname, '../foo.css'));
        done();
      })
      .end(new File({
        path: path.join(__dirname, '../foo.css'),
        contents: new Buffer('@import url("../bar/../baz/../../external.css");')
      }));
    });
  });

  describe('in stream mode', () => {
    it('should minify CSS files', done => {
      minifyCSS(opts)
      .on('error', done)
      .on('data', file => {
        file.contents.on('data', data => {
          expect(file.isStream()).to.be.equal(true);
          expect(String(data)).to.be.equal('@font-face{src:local("baz"),url(1/2/3/font.eot)}');
          done();
        });
      })
      .end(new File({
        path: path.join(__dirname, 'foo/bar.css'),
        contents: stringToStream('@font-face { src: local("baz"), url("1/2/3/font.eot"); }')
      }));
    });

    it('should emit an error when the CSS is corrupt', done => {
      minifyCSS()
      .on('error', err => {
        expect(err).to.be.instanceOf(PluginError);
        expect(err.fileName).to.be.equal(path.join(__dirname, '../foo.css'));
        done();
      })
      .end(new File({
        path: path.join(__dirname, '../foo.css'),
        contents: stringToStream('@import url("../fixture.css");')
      }));
    });
  });

  describe('with external files', () => {
    it('should minify include external files', done => {
      minifyCSS()
      .on('error', done)
      .on('data', file => {
        expect(String(file.contents)).to.be.equal('p{text-align:center;color:green}');
        done();
      })
      .end(new File({
        path: path.join(__dirname, 'foo////////../importer.css'),
        contents: new Buffer('@import "fixture.css";')
      }));
    });
  });
});

describe('gulp-minify-css source map', function() {
  this.timeout(7500);

  it('should generate source map with correct mapping', done => {
    const server = createServer(function(req, res) {
      res.writeHead(200, {'Content-Type': 'text/plain'});
      res.end('b { color: aqua }\n');
    }).listen(8910);
    server.timeout = 20000;

    const originalDone = done;
    done = err => {
      server.close();
      originalDone(err);
    };

    const write = sourceMaps.write()
    .on('data', file => {
      const expected = '/*! header */p{text-align:center}b,p{color:#0ff}\n\n';
      expect(String(file.contents).replace(/\/\*#.*/, '')).to.be.equal(expected);
      expect(file.sourceMap.mappings).to.be.equal('aAAA,EACE,WAAY,OCDd,ECIA,EDJI,MAAO');

      const sourcemapRegex = /sourceMappingURL=data:application\/json;base64/;
      expect(sourcemapRegex.test(String(file.contents))).to.be.equal(true);

      expect(file.sourceMap).to.have.property('file');
      expect(file.sourceMap.file).to.be.equal('sourcemap.css');

      expect(file.sourceMap.sources).to.be.deep.equal([
        'fixture.css',
        'http://127.0.0.1:8910/',
        'sourcemap.css'
      ]);
      done();
    });

    combine.obj(
      sourceMaps.init(),
      minifyCSS(),
      write
    )
    .on('error', done)
    .end(new File({
      base: path.join(__dirname),
      path: path.join(__dirname, 'sourcemap.css'),
      contents: new Buffer([
        '/*! header */',
        '@import "fixture.css";',
        '@import url(http://127.0.0.1:8910/);',
        '',
        'p { color: aqua }'
      ].join('\n'))
    }));
  });

  it('should generate source map with correct sources when using preprocessor (stylus) and gulp.src without base', function(done) {
    const write = sourceMaps.write()
    .on('data', file => {
      expect(file.sourceMap.sources).to.be.deep.equal([
        'fixture.css',
        'importer.css'
      ]);
      done();
    });

    combine.obj(
      sourceMaps.init({loadMaps: true}),
      stylus(),
      minifyCSS(),
      write
    )
    .on('error', done)
    .end(new File({
      base: path.join(__dirname),
      path: path.join(__dirname, 'importer.css'),
      contents: new Buffer('@import "fixture.css";\np { color: gray; }')
    }));
  });

  it('should generate source map with correct sources when using preprocessor (stylus) and gulp.src with base', function(done) {
    const write = sourceMaps.write()
    .on('data', file => {
      expect(file.sourceMap.sources).to.be.deep.equal([
        'test/fixture.css',
        'test/importer.css'
      ]);
      done();
    });

    combine.obj(
      sourceMaps.init(),
      stylus(),
      minifyCSS(),
      write
    )
    .on('error', done)
    .end(new File({
      base: '.',
      path: path.join(__dirname, 'importer.css'),
      contents: new Buffer('@import "fixture.css";\na {color: blue}')
    }));
  });
});
