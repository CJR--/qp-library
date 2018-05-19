define(module, function(exports, require) {

  var qp = require('qp-utility');

  qp.make(exports, {

    ns: 'qp-library/stringbuilder',

    eol: '\n',
    eol_re: /\n/,
    indent_string: '  ',
    line_re: /^(?=.)/gm,
    items: [],

    init: function() { },

    append_lines: function(txt) {
      this.items = this.items.concat(txt.split(this.line_re).map(function(s) {
        return String(s).replace(this.eol_re, '');
      }, this));
      return this;
    },

    append: function() {
      this.items = this.items.concat(qp.arg(arguments).join(''));
      return this;
    },

    set_indent: function(indent_string) {
      this.indent_string = indent_string;
      return this;
    },

    set_eol: function(eol_string) {
      this.eol = eol_string;
      this.eol_re = new RegExp(this.eol);
      return this;
    },

    indent: function(count, opt_indent) {
      var tmp_indent = new Array(count + 1).join(opt_indent || this.indent_string);
      this.items = this.items.map(function(line) { return tmp_indent + line;  });
      return this;
    },

    clear: function() {
      this.items = [];
    },

    lines: function() {
      return this.items.join(this.eol);
    },

    join: function(sep) {
      return this.items.join(sep || ',');
    },

    toString: function() {
      return this.items.join('');
    }

  });

});
