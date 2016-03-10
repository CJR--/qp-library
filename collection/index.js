define(module, function(exports, require, make) {

  var qp = require('qp-utility');
  var events = require('qp-library/event');

  make('qp-library/collection', {

    mixin: [ events ],

    properties: {
      model: '',
      items: []
    },

    init: function() { },

    at: function() { },
    first: function() { },
    last: function() { },
    map: function() { },
    reduce: function() { },
    each: function(fn) { return qp.each(this.items, fn, this); },
    contains: function() { },
    find: function() { },
    find_all: function() { },
    range: function() { },
    pick: function() { },
    clone: function() { },
    sort: function() { },
    group: function() { },
    all: function() { },
    any: function() { },
    none: function() { },
    min: function() { },
    max: function() { },
    count: function() { },

    union: function() { },
    partition: function() { },

    load: function() { },
    reload: function() { },

    add: function() { },
    remove: function() { },
    remove_all: function() { },

    validate: function() { }

  });

});
