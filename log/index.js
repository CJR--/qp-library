var util = require('util');

var log = function() {
  console.log.apply(console, arguments);
};

log.clear = function() {
  if (process.platform === 'win32') {
    process.stdout.write('\033c');
  } else {
    process.stdout.write('\u001B[2J\u001B[0;0f');
  }
};

log.dir = function(o, options) {
  console.log(util.inspect(o, options || { showHidden: false, depth: null, colors: true }));
};

log.blue_white = function(s) { return '\x1b[47m\x1b[34m' + s + '\x1b[0m\x1b[0m'; };
log.red = function(s) { return '\x1b[31m' + s + '\x1b[0m'; };
log.green = function(s) { return '\x1b[32m' + s + '\x1b[0m'; };
log.yellow = function(s) { return '\x1b[33m' + s + '\x1b[0m'; };
log.blue = function(s) { return '\x1b[34m' + s + '\x1b[0m'; };
log.magenta = function(s) { return '\x1b[35m' + s + '\x1b[0m'; };
log.cyan = function(s) { return '\x1b[36m' + s + '\x1b[0m'; };
log.white = function(s) { return '\x1b[37m' + s + '\x1b[0m'; };

module.exports = log;
