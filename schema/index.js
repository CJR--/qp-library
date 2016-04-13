define(module, function(exports, require) {

  var schema = function(def) {
    
  };

  schema.create = function(data) {

  };

  schema.field = function(type, size) {

  };

  schema.field.primary = function() {
    return { type: 'integer', primary: true };
  };

  schema.field.foreign = function() {
    return { type: 'integer', foreign: true };
  };

  schema.field.created = function() {
    return { type: 'timestamp', default: 'now' };
  };

  schema.field.modified = function() {
    return { type: 'timestamp', default: 'now' };
  };

  exports('qp-library/schema', schema);

});
