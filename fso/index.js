define(module, function(exports, require, make) {

  var path = require('path');
  var mime = require('mime');
  var semver = require('semver');
  var qp = require('qp-utility');
  var fss = require('qp-library/fss');

  make({

    ns: 'qp-library/fso',

    self: {

      has_filename: function(filepath) {
        var parts = qp.trim(filepath, path.sep).split(path.sep);
        return parts.pop().indexOf('.') !== -1;
      },

      filename: function(filepath) {
        var parts = qp.trim(filepath, path.sep).split(path.sep);
        var part = parts.pop();
        return part.indexOf('.') === -1 ? '' : part;
      },

      extension: function(filepath) {
        return filepath.indexOf('.') !== -1 ? qp.split(filepath, '.').pop() : '';
      },

      pathname: function(filepath) {
        var parts = qp.trim(filepath, path.sep).split(path.sep);
        if (parts.slice(-1)[0].indexOf('.') !== -1) {
          parts.pop();
        }
        return path.sep + parts.join(path.sep) + path.sep;
      },

      load: function() {
        return this.create({ path: path.join.apply(null, qp.compact(arguments)) });
      },

      split: function(filepath) {
        return qp.trim(filepath, path.sep).split(path.sep);
      },

      join: function() {
        return path.join.apply(null, qp.compact(arguments));
      },

      // eg: /one/two/three-v1.0.14-alpha.3.four
      // version: 1.0.14-alpha.3
      parse_version: function(filepath) {
        var filename = qp.before_last(this.filename(filepath), '.');
        var version = semver.clean(qp.after(filename, '-v'));
        return version;
      },

      has_version: function(filepath) {
        return qp.contains(this.filename(filepath), '-v');
      }

    },

    exists: false,
    is_file: false,
    is_directory: false,
    has_version: false,
    ino: 0,
    atime: 0,
    mtime: 0,
    ctime: 0,
    size: 0,
    mime: '',

    fullname: '', // eg: /one/two/three.four || /one/two/three
    filename: '', // eg: /one/two/three.four
    filepath: '', // eg: /one/two/three
    version: '',  // eg: 1.0.14

    path: '',     // eg: /one/two
    file: '',     // eg: three.four
    name: '',     // eg: three
    ext: '',      // eg: four

    init: function(config) {
      if (qp.is(config.fso, 'fso')) {
        this.fullname = config.fso.fullname;
      } else if (qp.is(config.url, 'url')) {
        var fullname = path.join(config.base, config.url.fullname);
        if (qp.starts(fullname, config.base)) {
          this.fullname = fullname;
        }
      } else if (qp.is(config.path, 'string')) {
        this.fullname = path.join(config.base || '', config.path);
      } else if (qp.is(config.path, 'array')) {
        this.fullname = path.join.apply(null, config.path);
      }

      if (config.ext) {
        this.fullname = qp.rtrim(this.fullname, this.sep) + '.' + config.ext;
      }

      this.exists = fss.exists(this.fullname);
      if (this.exists) {
        var stat = fss.stat(this.fullname);
        this.size = stat.size;
        this.is_file = stat.isFile();
        this.is_directory = stat.isDirectory();
        this.ino = stat.ino;
        this.atime = stat.atime;
        this.mtime = stat.mtime;
        this.ctime = stat.ctime;
      }
      if (!this.exists || this.is_file) {
        this.path = this.self.pathname(this.fullname);
        this.file = this.self.filename(this.fullname);
        if (this.file.length) {
          this.is_file = true;
          var parts = qp.split(this.file, '.');
          this.ext = parts.pop();
          this.name = parts.join('.');
        } else {
          this.is_directory = true;
        }
      }
      if (this.is_file) {
        this.filename = this.fullname;
        this.filepath = qp.rtrim(this.fullname, '.' + this.ext);
        if (qp.contains(this.filename, '-v')) {
          this.version = this.self.parse_version(this.filename);
          this.has_version = qp.not_empty(this.version);
        }
      }
      this.mime = mime.lookup(this.fullname);
    },

    set_ext: function(ext) {
      if (this.is_file) {
        return this.self.create({ path: this.path + this.name + '.' + qp.ltrim(ext, '.') });
      } else if (this.is_directory) {
        return this.self.create({ path: qp.rtrim(this.path, path.sep) + '.' + qp.ltrim(ext, '.') });
      }
    },

    set_file: function(name, ext) {
      if (this.is_file) {
        return this.self.create({ path: this.path + path.sep + name + '.' + qp.ltrim(ext, '.') });
      } else if (this.is_directory) {
        return this.self.create({ path: this.path + name + '.' + qp.ltrim(ext, '.') });
      }
    },

    read_sync: function() { return this.is_file ? fss.read(this.filename) : ''; }

  });

});
