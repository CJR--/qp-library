define(module, function(exports, require, make) {

  var qp = require('qp-utility');

  make('qp-library/model', {

    data: null,

    init: function() {
      var data = {};
      qp.each(this.attributes, function(attribute) {

      }, this);
    },

    pick: function() { },
    clone: function() { },

    get: function() { },
    set: function() { },

    clear: function() { },

    validate: function() { }

  });

});
