define(module, function(exports, require) {

  var util = require('util');

  function log() {
    console.log.apply(console, arguments);
  }

  exports('library::log', log, {

    clear: function() {
     if (process.platform === 'win32') {
       process.stdout.write('\033c');
     } else {
       process.stdout.write('\u001B[2J\u001B[0;0f');
     }
    },

    dir: function(o, options) {
     console.log(util.inspect(o, options || { showHidden: false, depth: null, colors: true }));
    },

    blue_white: function(s) { return '\x1b[47m\x1b[34m' + s + '\x1b[0m\x1b[0m'; },
    red: function(s) { return '\x1b[31m' + s + '\x1b[0m'; },
    green: function(s) { return '\x1b[32m' + s + '\x1b[0m'; },
    yellow: function(s) { return '\x1b[33m' + s + '\x1b[0m'; },
    blue: function(s) { return '\x1b[34m' + s + '\x1b[0m'; },
    magenta: function(s) { return '\x1b[35m' + s + '\x1b[0m'; },
    cyan: function(s) { return '\x1b[36m' + s + '\x1b[0m'; },
    white: function(s) { return '\x1b[37m' + s + '\x1b[0m'; }

  });

});
