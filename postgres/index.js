define(module, (exports, require, make) => {

  var qp = require('qp-utility');
  var log = require('qp-library/log');

  var named_param_re = /\:[-a-zA-Z0-9_]+/g;

  make({

    ns: 'qp-library/postgres',

    connection: null,

    select: function(config) {
      if (qp.is(config.model, 'number')) {
        config.model = { id: config.model.id };
      }
      var done = config.done || qp.noop;
      var cmd = this.prepare(config);
      log(cmd.pg.text);
      log(cmd.pg.values);
      this.connection.query(cmd.pg, (error, pg_result) => {
        if (error) {
          done(error);
        } else if (pg_result.rows > 1) {
          done(new Error('Select cannot return multiple rows'));
        } else {
          log(pg_result.rows[0]);
          if (config.model) {
            done(null, config.model.create(pg_result.rows[0], config.options));
          } else {
            done(null, pg_result.rows[0]);
          }
        }
      });
    },

    select_all: function(config) {
      var done = config.done || qp.noop;
      var cmd = this.prepare(config);
      log(cmd.pg.text);
      log(cmd.pg.values);
      this.connection.query(cmd.pg, (error, result) => {
        if (error) {
          done(error);
        } else {
          log(result.rows.length, 'rows');
          if (config.model) {
            done(null, qp.map(result.rows, data => config.model.create(data, config.options)));
          } else {
            done(null, result.rows);
          }
        }
      });
    },

    insert: function(config) {
      config.model.created = config.model.modified = qp.now();
      this.execute(config);
    },

    update: function(config) {
      config.model.modified = qp.now();
      this.execute(config);
    },

    delete: function(config) {
      if (qp.is(config.model, 'number')) {
        config.model = { id: config.model.id };
      }
      this.execute(config);
    },

    execute: function(config) {
      var done = config.done || qp.noop;
      var cmd = this.prepare(config);
      log(cmd.pg.text);
      log(cmd.pg.values);
      this.connection.query(cmd.pg, (error, pg_result) => {
        if (error) { log(error); done(error); } else {
          var result = { cmd: cmd, row_count: pg_result.rowCount, rows: pg_result.rows };
          if (cmd.insert) result.id = pg_result.rows[0].id;
          if (cmd.delete) result.count = pg_result.rows[0].count;
          log(pg_result.rows.length, 'rows');
          done(null, result);
        }
      });
    },

    prepare: function(config) {
      var text = qp.is(config.text, 'array') ? config.text.join(' ') : config.text;
      var type = text.slice(0, 6);
      var cmd = {
        name: config.name,
        type: type,
        non_query: qp.inlist(type, 'INSERT', 'UPDATE', 'DELETE')
      };
      cmd[qp.lower(type)] = true;
      var values = config.values || [];
      var model = config.model || {};
      cmd.text = text.replace(named_param_re, function(match) {
        values.push(model[match.slice(1)]);
        return '$' + values.length;
      });
      cmd.created = model.created;
      cmd.modified = model.modified;
      if (cmd.insert) cmd.text += ' RETURNING id';
      cmd.pg = { name: cmd.name, text: cmd.text, values: values };
      return cmd;
    }

  });

});
