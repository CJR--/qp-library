define(module, function(exports, require) {

  var env = process.env;
  var qp = require('qp-utility');
  var pg = require('pg');
  var log = require('qp-library/log');

  var pool = null;
  var options = null;

  var default_options = {
    application_name: env.APP_NAME || env.PGAPPNAME || '',
    database: env.PG_DATABASE || env.PGDATABASE || '',
    host: env.PG_HOST || 'localhost',
    port: env.PG_PORT || env.PGPORT || 5432,

    ssl: env.PG_SSL_MODE || env.PGSSLMODE || false,
    max: env.PG_MAX_POOL || 20,
    min: env.PG_MIN_POOL || 4,
    idleTimeoutMillis: env.PG_IDLE_TIME || 1000,

    admin: false,
    app_user: env.PG_USER || env.PGUSER || '',
    app_password: env.PG_PASS || env.PGPASSWORD || '',
    admin_user: env.PG_ADMIN_USER || env.PG_USER || env.PGUSER || '',
    admin_password: env.PG_ADMIN_PASS || env.PG_PASS || env.PGPASSWORD || '',

    schema: null,

    on_connect: (client) => log_event('CONNECT', client),
    on_aquire: (client) => log_event('AQUIRE', client),
    on_remove: (client) => log_event('REMOVE', client),
    on_error: (error, client) => {
      log.postgres('PG ', 'ERROR', error.message);
      log_event('ERROR', client);
    }
  };

  function get_options(o) {
    options = qp.options(o, default_options);
    if (options.admin) {
      options.user = options.admin_user;
      options.password = options.admin_password;
    } else {
      if (!options.user) options.user = options.app_user;
      options.password = options.app_password;
    }
    return options;
  }

  function log_event(event_name, client) {
    log.postgres(event_name, '{', 'total: ' + pool.totalCount + ',', 'idle: ' + pool.idleCount + ',', 'wait: ' + pool.waitingCount, '}');
  }

  exports({

    open: function(o) {
      if (pool === null) {
        pool = new pg.Pool(get_options(o));
        pool.on('connect', options.on_connect);
        pool.on('aquire', options.on_aquire);
        pool.on('remove', options.on_remove);
        pool.on('error', options.on_error);
      }
      log.postgres('OPEN', qp.format('{{host}}:{{port}} ({{database}}:{{user}}) {{schema}}', options));
      return options;
    },

    create_client: function(o) {
      return new pg.Client(get_options(o));
    },

    connect: function(handler) {
      if (pool.options.schema) {
        pool.connect(function(error, connection, close_connection) {
          if (!error) {
            connection.query('SET search_path TO ' + pool.options.schema + ', public', function(error, result) {
              handler(error, connection, close_connection);
            });
          } else {
            handler(error, connection, close_connection);
          }
        });
      } else {
        pool.connect(handler);
      }
    },

    query: function(cmd, values, handler) {
      return pool.query(qp.is_array(cmd) ? qp.build(cmd) : cmd, values, handler);
    },

    close: function(done) {
      if (pool === null) {
        done();
      } else {
        pool.end(() => {
          pool = options = null;
          done();
        });
      }
    }

  });

});
