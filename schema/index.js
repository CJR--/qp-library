define(module, function(exports, require) {

  exports('qp-library/schema', {

    field: {
      primary: { type: 'integer', primary: true },
      foreign: { type: 'integer', foreign: true },

      created: { type: 'timestamp', default: 'now' },
      modified: { type: 'timestamp', default: 'now' }
    },

    create: function(def) {
      return def;
    }

  });

});
