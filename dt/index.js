define(module, function(exports, require) {

  var qp = require('qp-utility');

  exports('library::dt', {

    self: {

      now: function() { },
      noon: function() { },
      midnight: function() { },
      range: function(a, b) { }

    },

    properties: {
      timestamp: 0
    }

  }, qp.make);

});
