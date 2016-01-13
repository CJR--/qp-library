define(module, function(exports, require, make) {

  var qp = require('qp-utility');

  make('qp-library/dt', {

    self: {

      now: function() { },
      noon: function() { },
      midnight: function() { },
      range: function(a, b) { }

    },

    properties: {
      timestamp: 0
    }

  });

});
