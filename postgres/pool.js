define(module, function(exports, require) {

  var env = process.env;
  var qp = require('qp-utility');
  var pg = require('pg');
  var log = require('qp-library/log');
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
    application_name: env.APP_NAME || env.PGAPPNAME || '',

    on_connect: (client) => log_event('CONN', client),
    on_aquire: (client) => log_event('OPEN', client),
    on_remove: (client) => log_event('SHUT', client),
    on_error: (error, client) => {
      log.postgres('PG ', 'ERROR', error.message);
      log_event('ERROR', client);
    }
  };

  function log_event(event_name, client) {
    log.postgres(event_name, '{', 'total: ' + pool.totalCount + ',', 'idle: ' + pool.idleCount + ',', 'wait: ' + pool.waitingCount, '}');
  }

  exports({

    open: function(o) {
      if (pool === null) {
        options = qp.options(o, options);
        pool = new pg.Pool(options);
        pool.on('connect', options.on_connect);
        pool.on('aquire', options.on_aquire);
        pool.on('remove', options.on_remove);
        pool.on('error', options.on_error);
      }
    },

    create_client: function(o) {
      return new pg.Client(qp.options(o, options));
    },

    connect: function(handler) { return pool.connect(handler); },

    query: function(cmd, values, handler) { return pool.query(cmd, values, handler); },

    close: function(done) {
      if (pool === null) done(); else pool.end(done);
    }

  });

});
