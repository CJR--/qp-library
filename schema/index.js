define(module, function(exports, require, make) {

  var qp = require('qp-utility');

  function default_string() { return ''; }
  function default_number() { return 0; }
  function default_boolean() { return false; }
  function default_datetime() { return new Date(); }
  function default_date() {
    var date = new Date();
    date.setUTCHours(12, 0, 0, 0);
    return date;
  }

  exports({

    ns: 'qp-library/schema',

    build: function(_exports, schema) {
      schema.create = this.create.bind(this, schema.fields);
      _exports(schema);
    },

    create: function(fields, data, options) {
      options = qp.options(options, { internal: false });
      var o = {};
      qp.each_own(fields, function(v, k) {
        if (options.internal || !v.internal) {
          o[k] = data ? data[k] || v.default() : v.default();
        }
      });
      return o;
    },

    field: function(type, size, options) {
      var field;
      if (type === 'text') {
        field = { type: 'string', size: size, default: default_string };
      } else if (type === 'int') {
        field = { type: 'number', size: size, default: default_number };
      } else if (type === 'bool') {
        field = { type: 'boolean', default: default_boolean };
      } else if (type === 'datetime') {
        field = { type: 'date', default: default_datetime };
      } else if (type === 'date') {
        field = { type: 'date', default: default_date };
      } else {
        field = { type: '', default: qp.noop };
      }
      return qp.options(field, options);
    },

    primary: function() {
      return this.field('int', 64, { primary: true });
    },

    foreign: function() {
      return this.field('int', 64, { foreign: true });
    },

    created: function() {
      return this.field('datetime');
    },

    modified: function() {
      return this.field('datetime');
    }

  });

});
