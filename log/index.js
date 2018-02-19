define(module, function(exports, require) {

  var util = require('util');
  var qp = require('qp-utility');
  var fss = require('qp-library/fss');
  var os = require('os');

  var debug = /--inspect/.test(process.execArgv.join(' '));

  var log = function log() {
    console.log.apply(console, arguments);
  };

  log.clear = function() {
    if (debug) {
      console.clear();
    } else {
      if (process.platform === 'win32') {
        process.stdout.write('\033c');
      } else {
        process.stdout.write('\u001B[2J\u001B[0;0f');
      }
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

  log.socket = function(type) {
    console.log.apply(console, qp.union([log.yellow('WS  ' + qp.rpad(type, 4))], qp.rest(arguments)));
  };

  log.postgres = function(type) {
    console.log.apply(console, qp.union([log.yellow('PG  ' + qp.rpad(type, 4))], qp.rest(arguments)));
  };

  if (debug) {
    var plain_text = function() { return qp.join(arguments, ' '); };
    log.blue_white = plain_text;
    log.red_white = plain_text;
    log.white_red = plain_text;
    log.yellow_black = plain_text;
    log.red = plain_text;
    log.green = plain_text;
    log.yellow = plain_text;
    log.blue = plain_text;
    log.magenta = plain_text;
    log.cyan = plain_text;
    log.white = plain_text;
  } else {
    log.blue_white = function() { return '\x1b[47m\x1b[34m' + qp.join(arguments, ' ') + '\x1b[0m\x1b[0m'; };
    log.red_white = function() { return '\x1b[47m\x1b[31m' + qp.join(arguments, ' ') + '\x1b[0m\x1b[0m'; };
    log.white_red = function() { return '\x1b[41m\x1b[37m' + qp.join(arguments, ' ') + '\x1b[0m\x1b[0m'; };
    log.yellow_black = function() { return '\x1b[43m\x1b[30m' + qp.join(arguments, ' ') + '\x1b[0m\x1b[0m'; };
    log.red = function() { return '\x1b[31m' + qp.join(arguments, ' ') + '\x1b[0m'; };
    log.green = function() { return '\x1b[32m' + qp.join(arguments, ' ') + '\x1b[0m'; };
    log.yellow = function() { return '\x1b[33m' + qp.join(arguments, ' ') + '\x1b[0m'; };
    log.blue = function() { return '\x1b[34m' + qp.join(arguments, ' ') + '\x1b[0m'; };
    log.magenta = function() { return '\x1b[35m' + qp.join(arguments, ' ') + '\x1b[0m'; };
    log.cyan = function() { return '\x1b[36m' + qp.join(arguments, ' ') + '\x1b[0m'; };
    log.white = function() { return '\x1b[37m' + qp.join(arguments, ' ') + '\x1b[0m'; };
  }

  exports('qp-library/log', log);

});
