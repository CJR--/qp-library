define(module, function(exports, require) {

  var qp = require('qp-utility');

  exports('library::event', {

    properties: {
      event_handlers: {}
    },

    on: function(e, handler, scope) {
      handler = handler.bind(scope || this);
      if (!this.event_handlers[e]) {
        this.event_handlers[e] = [handler];
      } else {
        this.event_handlers[e].push(handler);
      }
      return handler;
    },

    fire: function(e, data) {
      var event = qp.is(e, 'string') ? { event: e } : e;
      var name = event.event;
      var handlers = this.event_handlers[name];
      if (handlers) {
        for (var i = 0, l = handlers.length; i < l; i++) {
          handlers[i](event, data);
        }
      }
    },

    un: function(e, handler) {
      var handlers = this.event_handlers[e];
      if (handlers) {
        for (var i = 0, l = handlers.length; i < l; i++) {
          if (handlers[i] === handler) {
            handlers.splice(i, 1);
            break;
          }
        }
      }
    }

  }, qp.make);

});
