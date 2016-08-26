define(module, (exports, require, make) => {

  var qp = require('qp-utility');
  var log = require('qp-library/log');

  var named_param_re = /\:[-a-zA-Z0-9_]+/g;

  make({

    ns: 'qp-library/postgres',

    connection: null,

    initialise: function(data) {
      return typeof data === 'object' ? data : { id: data };
    },

    select: function(config) {
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
          done(null, pg_result.rows[0]);
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
          done(null, result.rows);
        }
      });
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
      var data = config.data || {};
      cmd.text = text.replace(named_param_re, function(match) {
        values.push(data[match.slice(1)]);
        return '$' + values.length;
      });
      if (cmd.insert) cmd.text += ' RETURNING id';
      cmd.pg = { name: cmd.name, text: cmd.text, values: values };
      return cmd;
    }

  });

});
