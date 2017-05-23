define(module, function(exports, require, make) {

  var url = require('url');
  var pg = require('pg');
  var qp = require('qp-utility');
  var pool = null;

  qp.module(exports, {

    connect: function(db_credentials, handler) {
      if (pool === null) {
        var conn = url.parse(db_credentials);
        var auth = conn.auth.split(':');
        pool = new pg.Pool({
          user: auth[0],
          password: auth[1],
          host: conn.hostname,
          port: conn.port,
          database: conn.pathname.split('/')[1]
        });
      }
      return pool.connect(handler);
    },

    close: function() {
      if (this.pool) pool.end();
    }

  });

});
