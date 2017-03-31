define(module, function(exports, require) {

  var util = require('util');
  var qp = require('qp-utility');
  var fss = require('qp-library/fss');
  var os = require('os');

  var log = function log() {
    console.log.apply(console, qp.compact(arguments));
  };

  log.ns = 'qp-library/log';

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

  log.file = function(log_file, o, eol_count) {
    fss.append(log_file, JSON.stringify(o, null, '  ') + qp.repeat(os.EOL, eol_count || 0));
  };

  log.error = function() {
    if (qp.is(arguments[0], 'error')) {
      console.error(util.inspect(arguments[0], arguments[1] || { showHidden: false, depth: null, colors: true }));
    } else {
      console.error(arguments[0], util.inspect(arguments[1], arguments[2] || { showHidden: false, depth: null, colors: true }));
    }
  };

  log.socket = function(type, _1, _2, _3) {
    console.log(log.yellow(qp.rpad(type, 8)), _1 || '', _2 || '', _3 || '');
  };

  log.blue_white = function(s) { return '\x1b[47m\x1b[34m' + s + '\x1b[0m\x1b[0m'; };
  log.red_white = function(s) { return '\x1b[47m\x1b[31m' + s + '\x1b[0m\x1b[0m'; };
  log.white_red = function(s) { return '\x1b[41m\x1b[37m' + s + '\x1b[0m\x1b[0m'; };
  log.yellow_black = function(s) { return '\x1b[43m\x1b[30m' + s + '\x1b[0m\x1b[0m'; };
  log.red = function(s) { return '\x1b[31m' + s + '\x1b[0m'; };
  log.green = function(s) { return '\x1b[32m' + s + '\x1b[0m'; };
  log.yellow = function(s) { return '\x1b[33m' + s + '\x1b[0m'; };
  log.blue = function(s) { return '\x1b[34m' + s + '\x1b[0m'; };
  log.magenta = function(s) { return '\x1b[35m' + s + '\x1b[0m'; };
  log.cyan = function(s) { return '\x1b[36m' + s + '\x1b[0m'; };
  log.white = function(s) { return '\x1b[37m' + s + '\x1b[0m'; };

  exports(log);

});
