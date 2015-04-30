define(module, function(exports, require) {

  var qp = require('qp-utility');

  exports('qp-library/model', {

    properties: {
      data: null
    },

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

  }, qp.make);

});
