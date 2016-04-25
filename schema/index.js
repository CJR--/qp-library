define(module, function(exports, require) {

  function schema(def) {
    return def;
  }

  schema.ns = 'qp-library/schema';

  schema.create = function(data) {

  };

  schema.field = function(type, size) {
    if (type === 'text') return { type: 'string', default: '' };
    else if (type === 'int') return { type: 'number', size: size, default: 0 };
    else if (type === 'bool') return { type: 'boolean', default: false };
    else if (type === 'datetime') return { type: 'date', default: function() { return new Date(); } };
    else if (type === 'date') return { type: 'date', default: function() { return new Date(); } };
  };

  schema.primary = function() {
    return { type: 'integer', primary: true };
  };

  schema.foreign = function() {
    return { type: 'integer', foreign: true };
  };

  schema.created = function() {
    return { type: 'timestamp', default: 'now' };
  };

  schema.modified = function() {
    return { type: 'timestamp', default: 'now' };
  };

  exports(schema);

});
