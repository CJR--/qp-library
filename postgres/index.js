define(module, (exports, require) => {

  var qp = require('qp-utility');
  var log = require('qp-library/log');

  qp.make(exports, {

    ns: 'qp-library/postgres',

    connection: null,

    select: function(config) {
      config.select = true;
      this.execute(this.prepare(config), this.handlers(config));
    },

    select_all: function(config) {
      config.select = true;
      config.select_all = true;
      this.execute(this.prepare(config), this.handlers(config));
    },

    insert: function(config) {
      config.insert = true;
      this.execute(this.prepare(config), this.handlers(config));
    },

    update: function(config) {
      config.update = true;
      this.execute(this.prepare(config), this.handlers(config));
    },

    delete: function(config) {
      config.delete = true;
      this.execute(this.prepare(config), this.handlers(config));
    },

    execute: function(cmd, handlers) {
      this.connection.query(cmd, (error, pg_result) => {
        if ((cmd.select && !cmd.select_all) && pg_result.rowCount > 1) {
          error = new Error('Select cannot return multiple rows');
        }

        if (error) {
          log(cmd.text);
          log.error(error);
          qp.call(handlers.failure, error);
          qp.call(handlers.done, error);
        } else if (cmd.non_query) {
          var rows = pg_result.rows;
          let result = { row_count: pg_result.rowCount, rows: rows };
          if (cmd.insert) result.id = rows[0].id;
          if (cmd.delete) result.count = rows[0].count;
          qp.call(handlers.success, result);
          qp.call(handlers.done, null, result);
        } else if (cmd.select) {
          let result = cmd.select_all ? pg_result.rows : pg_result.rows[0];
          qp.call(handlers.success, result);
          qp.call(handlers.done, null, result);
        }
      });
    },

    handlers: function(config) {
      return { success: config.success, failure: config.failure, done: config.done };
    },

    prepare: function(config) {
      var text = qp.is(config.text, 'array') ? config.text.join(' ') : config.text;
      var cmd = {
        name: config.name || null,
        non_query: config.insert || config.update || config.delete,
        select: config.select || false,
        select_all: config.select_all || false,
        insert: config.insert || false,
        update: config.update || false,
        delete: config.delete || false,
        text: text,
        values: config.values || []
      };
      return cmd;
    }

  });

});
