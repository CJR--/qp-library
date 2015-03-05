define(module, function(exports, require) {

  var path = require('path');
  var mime = require('mime');
  var qp = require('qp-utility');
  var fss = require('library:fss');

  exports('fso', qp.make({

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

      pathname: function(filepath) {
        var parts = qp.trim(filepath, path.sep).split(path.sep);
        if (parts.slice(-1)[0].indexOf('.') !== -1) {
          parts.pop();
        }
        return path.sep + parts.join(path.sep) + path.sep;
      }

    },

    exists: false,
    is_file: false,
    is_directory: false,
    ino: 0,
    atime: 0,
    mtime: 0,
    ctime: 0,
    size: 0,
    mime: '',

    fullname: '', // eg: /one/two/three.four

    path: '',     // eg: /one/two
    file: '',     // eg: three.four
    name: '',     // eg: three
    ext: '',      // eg: four

    init: function(config) {
      if (qp.is(config, 'fso')) {
        this.fullname = config.fullname;
      } else if (qp.is(config.url, 'url')) {
        var fullname = path.join(config.base, config.url.fullname);
        if (qp.starts(fullname, config.base)) {
          this.fullname = fullname;
        }
      } else if (qp.is(config.path, 'string')) {
        this.fullname = config.path;
      } else if (qp.is(config.path, 'array')) {
        this.fullname = path.join.apply(null, config.path);
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
      this.mime = mime.lookup(this.fullname);
    },

    set_ext: function(ext) {
      return this.self.create({ path: this.path + this.name + '.' + qp.ltrim(ext, '.') });
    },

    set_file: function(name, ext) {
      return this.self.create({ path: this.path + name + '.' + qp.ltrim(ext, '.') });
    }

  }));

});
