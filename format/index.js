define(module, function(exports, require, make) {

  var qp = require('qp-utility');

  var slice = Array.prototype.slice;
  var escape = { '\'': '\\\'', '\n': '\\n' };

  make('qp-library/format', {

    cache: {},

    string: function(s) {
      var cached = this.cache[s];
      if (!cached) {
        cached = this.cache[s] = this.compile(s);
      }
      return cached.apply(null, slice.call(arguments));
    },

    compile: function(s) {
      var prev = 0;
      var arg = 0;
      var sb = ['return \''];
      for (var i = 0, l = s.length; i < l; i++) {
        var char = s[i];
        if (char === '%') {
          var type = s[i + 1];
          if (type === 's') {
            sb.push(s.slice(prev, i) + '\' + arguments[' + arg + '] + \'');
            prev = i + 2;
            arg++;
          } else if (type === 'j') {
            sb.push(s.slice(prev, i) + '\' + JSON.stringify(arguments[' + arg + ']) + \'');
            prev = i + 2;
            arg++;
          } else if (type === '%') {
            sb.push(s.slice(prev, i + 1));
            prev = i + 2;
            i++;
          }
        } else if (escape[char]) {
          sb.push(s.slice(prev, i) + escape[s[i]]);
          prev = i + 1;
        }
      }
      sb.push(s.slice(prev) + '\';');
      /*jslint evil: true*/
      return new Function(sb.join(''));
    }

  });

});
