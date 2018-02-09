define(module, function(exports, require) {

  var qp = require('qp-utility');
  var log = require('qp-library/log');
  var pg = require('qp-library/postgres/pool');

  qp.make(exports, {

    ns: 'qp-library/postgres/events',

    db: null,
    channels: null,
    auto: true,

    init: function(options) {
      this.db = pg.create_client(options);
      this.db.on('error', this.on_error);
      this.db.on('end', this.on_stop);
      this.db.on('notification', this.on_notification);
      this.channels = [];
      if (this.auto) this.start();
    },

    listen: function(channel, handler) {
      this.channels.push({ name: channel, handler: handler });
      this.db.query('LISTEN ' + channel);
    },

    unlisten: function(channel) {
      this.db.query('UNLISTEN ' + channel);
    },

    start: function() {
      if (this.db) {
        this.db.connect();
        this.on_start();
      }
    },

    on_notification: function(data) {
      var payload = JSON.parse(data.payload);
      qp.each(this.channels, (channel) => {
        if (data.channel === channel.name) {
          channel.handler(payload, function(error, result) { });
        }
      });
    },

    stop: function(done) {
      if (this.db) {
        this.db.end((error) => {
          this.clear_handlers();
          done(error);
        });
      } else {
        this.clear_handlers();
        done();
      }
    },

    clear_handlers: function() {
      qp.each(this.channels, channel => channel.handler = null);
    },

    on_start: function() { /* log('EventListener - Openned'); */ },
    on_error: function(e) { log.error(e); },
    on_stop: function() { /* log('EventListener - Closed'); */ }

  });

});
