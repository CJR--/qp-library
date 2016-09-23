define(module, function(exports, require) {

  exports({

    set_title: function(title) {
      process.stdout.write(String.fromCharCode(27) + ']0;' + title + String.fromCharCode(7));
    }

  });

});
