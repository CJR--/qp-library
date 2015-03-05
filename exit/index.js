define(module, function(exports, require) {
  var stdin = process.stdin;
  var exit_handler = function() {
    process.exit();
  };

  if (stdin.setRawMode) {
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');
    stdin.on('data', function(chr) {
      if (chr === '\u0003' || chr === '\u001b') {
        exit_handler();
      }
    });
  }

  exports('library::exit', {
    handler: function(handler) { exit_handler = handler; }
  });
});
