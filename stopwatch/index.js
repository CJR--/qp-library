define(module, function(exports, require) {

  var qp = require('qp-utility');

  exports('qp-library/stopwatch', {

    properties: {
      started: null,
      stopped: null
    },

    init: function(config) {
      if (config.start) { this.start(); }
    },

    start: function() {
      this.started = new Date();
      return this;
    },

    restart: function() {
      this.start();
      return this;
    },

    stop: function() {
      this.stopped = new Date();
      return this;
    },

    elapsed: function() {
      if (this.started && this.stopped) {
        return this.stopped - this.started;
      } else if (this.started) {
        return new Date() - this.started;
      } else {
        return 0;
      }
    },

    seconds: function() {
      return this.elapsed() / 1000;
    }

  }, qp.make);

});
