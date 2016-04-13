define(module, (exports, require, make) => {

  var named_param_re = /\:[-a-zA-Z0-9_]+/g;

  make({

    ns: 'qp-library/postgres',

    connection: null,

    init: function(o) {
      this.connection = o.connection;
    },

    select: function(cmd) {
      this.connection.query(this.prepare(cmd), (error, result) => {
        if (error) {
          cmd.done(error);
        } else if (result.rows > 1) {
          cmd.done(new Error('Select cannot return multiple rows'));
        } else {
          cmd.done(null, result.rows[0]);
        }
      });
    },

    select_all: function(cmd) {
      this.connection.query(this.prepare(cmd), (error, result) => {
        if (error) {
          cmd.done(error);
        } else {
          cmd.done(null, result.rows);
        }
      });
    },

    insert: function(cmd) {
      this.connection.query(this.prepare(cmd), (error, result) => {
        if (error) {
          cmd.done(error);
        } else {
          cmd.done(null, result.rows[0]._id);
        }
      });
    },

    update: function(cmd) {
      this.connection.query(this.prepare(cmd), (error, result) => {
        if (error) {
          cmd.done(error);
        } else {
          cmd.done(null, result.rowCount);
        }
      });
    },

    delete: function(cmd) {
      this.connection.query(this.prepare(cmd), (error, result) => {
        if (error) {
          cmd.done(error);
        } else {
          cmd.done(null, result.rowCount);
        }
      });
    },

    execute: function(cmd) {
      this.connection.query(this.prepare(cmd), cmd.done);
    },

    prepare: function(cmd) {
      var text = cmd.text;
      var values = cmd.values || [];
      var params = cmd.params || {};
      text = text.replace(named_param_re, function(match) {
        values.push(params[match.slice(1)]);
        return '$' + values.length;
      });
      if (text.slice(0, 7) === 'INSERT ') text += ' RETURNING _id';
      return { text: text, values: values, name: cmd.name };
    }

  });

});
