define(module, function(exports, require) {

  var qp = require('qp-utility');
  var fss = require('qp-library/fss');
  var format = require('qp-library/format').create();

  qp.make(exports, {

    ns: 'qp-library/string_db',

    db: null,
    cache: { },
    context: null,

    init: function(options) {
      this.db = fss.read_json(options.file);
    },

    get: function(locale, id) {
      var cached = this.cache[id];
      if (!cached) {
        var str = this.db[id];
        if (str) {
          var is_format = str.indexOf('%s') !== -1 || str.indexOf('%j') !== -1;
          cached = this.cache[id] = {
            string: str,
            format: is_format ? format.compile(str) : false
          };
        } else {
          return '';
        }
      }
      if (cached.format) {
        return cached.format.apply(this.context, qp.rest(arguments, 2));
      } else {
        return cached.string;
      }
    }

  });

});
