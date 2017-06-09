define(module, function(exports, require) {

  var env = process.env;
  var qp = require('qp-utility');
  var pg = require('pg');
  var pool = null;

  var options = {
    database: env.PG_DATABASE || env.PGDATABASE || '',
    host: env.PG_HOST || 'localhost',
    port: env.PG_PORT || env.PGPORT || 5432,
    ssl: env.PG_SSL_MODE || env.PGSSLMODE || false,
    max: env.PG_MAX_POOL || 20,
    min: env.PG_MIN_POOL || 4,
    idleTimeoutMillis: env.PG_IDLE_TIME || 1000,
    user: env.PG_USER || env.PGUSER || '',
    password: env.PG_PASS || env.PGPASSWORD || '',
    application_name: env.APP_NAME || env.PGAPPNAME || ''
  };

  exports({

    open: function(o) {
      if (pool === null) {
        options = qp.options(o, options);
        pool = new pg.Pool(options);
      }
    },

    create_client: function(o) {
      return new pg.Client(qp.options(o, options));
    },

    connect: function() { return pool.connect.apply(null, arguments); },
    query: function() { return pool.query.apply(null, arguments); },

    close: function() {
      if (pool !== null) pool.end();
    }

  });

});
