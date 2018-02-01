define(module, (exports, require) => {

  var qp = require('qp-utility');
  var log = require('qp-library/log');

  function quote(text) { return '"' + text + '"'; }

  qp.make(exports, {

    ns: 'qp-library/postgres/schema',

    connection: null,

    grant: function(data, done) {
      this.execute({
        text: [
          [ 'GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA', data.schema, 'TO', data.user ],
          [ 'GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA', data.schema, 'TO', data.user ]
        ],
        done: done
      });
    },

    create_sequences: function(data, done) {
      var sequences = qp.select(data.columns, (column) => {
        if (column.sequence) {
          return [ 'CREATE SEQUENCE', column.name + '_seq', 'OWNED BY', data.table.name + '.' + column.name ];
        }
      });

      if (qp.empty(sequences)) done();
      else this.execute({ text: sequences, done: done });
    },

    create_sequence: function(data, done) {
      this.execute({
        text: [ 'CREATE SEQUENCE', data.name ],
        done: done
      });
    },

    drop_sequence: function(data, done) {
      this.execute({
        text: [ 'DROP SEQUENCE IF EXISTS', data.name ],
        done: done
      });
    },

    create_table: function(data, done) {
      this.execute({
        text: [
          'CREATE TABLE', quote(data.table.name), '(',
            qp.map(data.columns, column => {
              var def = column.name;
              if (column.primary) {
                def += ' SERIAL PRIMARY KEY';
              } else if (column.primary_key) {
                def += ' INTEGER PRIMARY KEY';
              } else if (column.unique) {
                def += ' INTEGER';
              } else {
                def += ' ' + column.type;
                if (column.type === 'numeric') {
                  def += '(' + column.size + ',' + column.scale + ')';
                } else if (column.array) {
                  def += '[]';
                }
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

    add_column: function(data, done) {
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

    drop_trigger: function(data, done) {
      this.execute({
        text: [ 'DROP TRIGGER IF EXISTS', data.trigger.name, 'ON', data.table.name, 'CASCADE' ],
        done: done
      });
    },

    create_row_modified_procedure: function(data, done) {
      this.execute({
        text: [
          'CREATE OR REPLACE FUNCTION notify_row_modified() RETURNS trigger AS $$',
            'DECLARE',
            '  id bigint;',
            'BEGIN',
            '  IF TG_OP = \'INSERT\' OR TG_OP = \'UPDATE\' THEN',
            '    id = NEW.id;',
            '  ELSE',
            '    id = OLD.id;',
            '  END IF;',
            '  PERFORM pg_notify(\'row_modified\', json_build_object(\'table\', TG_TABLE_NAME, \'id\', id, \'type\', TG_OP)::text);',
            '  RETURN NEW;',
            'END;',
            '$$ LANGUAGE plpgsql;'
        ],
        done: done
      });
    },

    create_triggers: function(data, done) {
      var triggers = qp.map(data.triggers, (trigger) => {
        return this.create_trigger_command({ trigger: trigger, table: data.table });
      });

      if (qp.empty(triggers)) done();
      else this.execute({ text: triggers, done: done });
    },

    create_trigger: function(data, done) {
      this.execute({
        text: this.create_trigger_command(data),
        done: done
      });
    },

    create_trigger_command: function(data) {
      return [
        'CREATE TRIGGER', data.trigger.name, data.trigger.sequence || 'AFTER',
          data.trigger.event, 'ON', data.table.name,
          'FOR EACH', data.trigger.row ? 'ROW' : 'STATEMENT',
          'EXECUTE PROCEDURE', data.trigger.procedure + '()'
      ];
    },

    execute: function(config) {
      var done = config.done || qp.noop;
      var cmd = this.prepare(config);
      // log(cmd.text);
      this.connection.query(cmd, (error, pg_result) => {
        if (error) { log(error); done(error); } else {
          done(null, { cmd: cmd });
        }
      });
    },

    prepare: function(config) {
      var text = config.text;
      if (qp.is(config.text, 'array')) {
        if (qp.is(config.text[0], 'array')) {
          text = qp.map(config.text, cmd => cmd.join(' ') + ';').join(qp.eol());
        } else {
          text = config.text.join(' ');
        }
      }
      var cmd = { text: text, type: config.type };
      if (config.name) cmd.name = config.name;
      cmd[qp.lower(cmd.type)] = true;
      return cmd;
    }

  });

});
