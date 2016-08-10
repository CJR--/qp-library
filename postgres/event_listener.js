define(module, function(exports, require, make) {

  var pg = require('pg');
  var qp = require('qp-utility');
  var log = require('qp-library/log');

  make({

    ns: 'qp-library/postgres/event_listener',

    db: null,
    auto: true,

    init: function(options) {
      this.db = new pg.Client(options.db_credentials);
      this.db.on('error', this.on_error);
      this.db.on('end', this.on_stop);
      this.db.on('notification', (data) => {
        this.on_notification(options.on_notify, data);
      });
      if (this.auto) this.start();
    },

    listen: function(name) {
      this.db.query('LISTEN ' + name);
    },

    unlisten: function(name) {
      this.db.query('UNLISTEN ' + name);
    },

    start: function() {
      if (this.db) {
        this.db.connect();
        this.on_start();
      }
    },

    on_notification: function(notify_clients, data) {
      notify_clients(data, function(error, result) {
        // log
      });
    },

    stop: function() { if (this.db) this.db.end(); },
    on_start: function() { /* log('EventListener - Openned'); */ },
    on_error: function(e) { log.error(e); },
    on_stop: function() { /* log('EventListener - Closed'); */ }

  });

});
