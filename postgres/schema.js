define(module, (exports, require, make) => {

  var qp = require('qp-utility');
  var log = require('qp-library/log');

  function quote(text) { return '"' + text + '"'; }

  make({

    ns: 'qp-library/postgres/schema',

    connection: null,

    create_table: function(data, done) {
      this.execute({
        text: [
          'CREATE TABLE', quote(data.table.name), '(',
            qp.map(data.columns, column => {
              var def = column.name;
              if (column.primary) {
                def += ' SERIAL PRIMARY KEY';
              } else {
                def += ' ' + column.type;
                if (column.is_array) def += '[]';
              }
              return def;
            }).join(', '),
          ')'
        ],
        done: done
      });
    },

    drop_table: function(data, done) {
      this.execute({
        text: [ 'DROP TABLE IF EXISTS', quote(data.table.name) ],
        done: done
      });
    },

    rename_table: function(data, done) {
      this.execute({
        text: [ 'ALTER TABLE', data.table.name, 'RENAME TO', data.table.new_name ],
        done: done
      });
    },

    add_column: function() {
      this.execute({
        text: [ 'ALTER TABLE', data.table.name, 'ADD COLUMN', data.column.name, data.column.type ],
        done: done
      });
    },

    remove_column: function(data, done) {
      this.execute({
        text: [ 'ALTER TABLE', data.table.name, 'DROP COLUMN', data.column.name ],
        done: done
      });
    },

    change_column: function(data, done) {
      this.execute({
        text: [ 'ALTER TABLE', data.table.name, 'ALTER COLUMN', data.column.name, 'TYPE', data.column.type ],
        done: done
      });
    },

    rename_column: function(data, done) {
      this.execute({
        text: [ 'ALTER TABLE', data.table.name, 'RENAME COLUMN', data.column.name, 'TO', data.column.new_name ],
        done: done
      });
    },

    add_index: function() { },
    remove_index: function() { },
    add_constraint: function() { },
    remove_constraint: function() { },

    execute: function(config) {
      var done = config.done || qp.noop;
      var cmd = this.prepare(config);
      // log(cmd.pg.text)
      this.connection.query(cmd.pg, (error, pg_result) => {
        if (error) { done(error); } else {
          var result = { cmd: cmd };
          done(null, result);
        }
      });
    },

    prepare: function(config) {
      var text = qp.is(config.text, 'array') ? config.text.join(' ') : config.text;
      var cmd = { name: config.name, text: text, type: config.type };
      cmd[qp.lower(cmd.type)] = true;
      cmd.pg = { name: cmd.name, text: cmd.text };
      return cmd;
    }

  });

});
