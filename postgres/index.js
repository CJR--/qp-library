define(module, (exports, require) => {

  var qp = require('qp-utility');
  var log = require('qp-library/log');

  var named_param_re = /\:[-a-zA-Z0-9_]+/g;

  qp.make(exports, {

    ns: 'qp-library/postgres',

    connection: null,

    select: function(config) {
      if (qp.is(config.model, 'number')) config.model = { id: config.model.id };
      var done = config.done || qp.noop;
      var cmd = this.prepare(config);
      this.connection.query(cmd, (error, pg_result) => {
        if (error) {
          done(error);
        } else if (pg_result.rowCount > 1) {
          done(new Error('Select cannot return multiple rows'));
        } else {
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
      this.connection.query(cmd, (error, result) => {
        if (error) {
          done(error);
        } else {
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
      this.connection.query(cmd, (error, pg_result) => {
        if (error) { log(error); done(error); } else {
          var result = { cmd: cmd, row_count: pg_result.rowCount, rows: pg_result.rows };
          if (cmd.insert) result.id = pg_result.rows[0].id;
          if (cmd.delete) result.count = pg_result.rows[0].count;
          done(null, result);
        }
      });
    },

    prepare: function(config) {
      var text = qp.is(config.text, 'array') ? config.text.join(' ') : config.text;
      var type = text.slice(0, 6);
      var cmd = {
        type: type,
        non_query: qp.inlist(type, 'INSERT', 'UPDATE', 'DELETE')
      };
      cmd[qp.lower(type)] = true;
      var model = config.model || {};
      if (config.name) cmd.name = config.name;
      cmd.values = config.values || [];
      cmd.text = text.replace(named_param_re, function(match) {
        cmd.values.push(model[match.slice(1)]);
        return '$' + cmd.values.length;
      });
      if (model.created) cmd.created = model.created;
      if (model.modified) cmd.modified = model.modified;
      if (cmd.insert) cmd.text += ' RETURNING id';
      return cmd;
    }

  });

});
