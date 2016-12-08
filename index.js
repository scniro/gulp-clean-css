const applySourceMap = require('vinyl-sourcemaps-apply');
const CleanCSS = require('clean-css');
const objectAssign = require('object-assign');
const path = require('path');
const PluginError = require('gulp-util').PluginError;
const through = require('through2');

module.exports = function gulpCleanCSS(options, callback) {

  options = options || {};

  if (arguments.length === 1 && Object.prototype.toString.call(arguments[0]) === '[object Function]')
    callback = arguments[0];

  var transform = function (file, enc, cb) {

    if (file.isStream()) {
      this.emit('error', new PluginError('gulp-clean-css', 'Streaming not supported!'));
      return cb();
    }

    var fileOptions = objectAssign({target: file.path}, options);

    if (!fileOptions.relativeTo && (fileOptions.root || file.path))
      fileOptions.relativeTo = path.dirname(path.resolve(options.root || file.path));

    if (file.sourceMap)
      fileOptions.sourceMap = JSON.parse(JSON.stringify(file.sourceMap));

    var cssFile;
    var style = file.contents ? file.contents.toString() : '';

    //if (file.path) {
    //  cssFile = {};
    //  cssFile[file.path] = {styles: style};
    //}

    new CleanCSS(fileOptions).minify(style, function (errors, css) {

      if (errors)
        return cb(errors.join(' '));

      if (css.sourceMap) {

        var map = JSON.parse(css.sourceMap);
        map.file = path.relative(file.base, file.path);
        map.sources = map.sources.map(function (src) {
          return path.relative(file.base, src);
        });

        applySourceMap(file, map);
      }

      if (typeof callback === 'function') {
        var details = {
          'stats': css.stats,
          'errors': css.errors,
          'warnings': css.warnings,
          'path': file.path,
          'name': file.path.split(file.base)[1]
        }

        if (css.sourceMap)
          details['sourceMap'] = css.sourceMap;

        callback(details);
      }

      file.contents = new Buffer(css.styles);

      cb(null, file);
    });
  };

  return through.obj(transform);
};