define(module, (exports, require) => {

  var qp = require('qp-utility');
  var log = require('qp-library/log');

  function quote(text) { return '"' + text + '"'; }

  qp.make(exports, {

    ns: 'qp-library/postgres/schema',

    connection: null,

    create_schema: function(data, done) {
      this.execute({
        text: [ 'CREATE SCHEMA IF NOT EXISTS', data.schema_name ],
        done: done
      });
    },

    drop_schema: function(data, done) {
      this.execute({
        text: [ 'DROP SCHEMA IF EXISTS', data.schema_name, data.cascade ? 'CASCADE' : '' ],
        done: done
      });
    },

    create_user: function(data, done) {
      this.execute({
        text: [ 'CREATE USER', data.user, 'WITH PASSWORD', '\'' + data.password + '\'' ],
        done: done
      });
    },

    drop_user: function(data, done) {
      this.execute({
        text: [ 'DROP USER IF EXISTS', data.user ],
        done: done
      });
    },

    create_database: function(data, done) {
      this.execute({
        text: [ 'CREATE DATABASE', data.database.name, 'WITH OWNER', data.user ],
        done: done
      });
    },

    drop_database: function(data, done) {
      this.execute({
        text: [ 'DROP DATABASE IF EXISTS', data.database.name ],
        done: done
      });
    },

    grant_schema: function(data, done) {
      this.execute({
        text: [
          [ 'GRANT ALL PRIVILEGES ON SCHEMA', data.schema_name, 'TO', data.user ],
        ],
        done: done
      });
    },

    grant_all_tables: function(data, done) {
      this.execute({
        text: [
          [ 'GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA', data.schema_name, 'TO', data.user ],
          [ 'GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA', data.schema_name, 'TO', data.user ]
        ],
        done: done
      });
    },

    create_sequences: function(data, done) {
      var sequences = [];
      qp.each_own(data.columns, (column) => {
        if (column.sequence) {
          sequences.push([
            'CREATE SEQUENCE IF NOT EXISTS', data.table.fullname + '_' + column.name + '_seq',
            'OWNED BY', data.table.fullname + '.' + column.name
          ]);
        }
      });
      if (qp.empty(sequences)) done();
      else this.execute({ text: sequences, done: done });
    },

    create_sequence: function(data, done) {
      this.execute({
        text: [ 'CREATE SEQUENCE IF NOT EXISTS', data.sequence_name ],
        done: done
      });
    },

    set_sequence: function(data, done) {
      this.execute({
        text: [ 'SELECT setval(\'' + data.sequence_name + '\', ', data.value, ')' ],
        done: done
      });
    },

    initialise_sequence: function(data, done) {
      this.execute({
        text: [
          'SELECT setval(\'' + data.sequence_name + '\', max(', data.field_name || 'id', ') + 1) FROM', data.table_name
        ],
        done: done
      });
    },

    drop_sequence: function(data, done) {
      this.execute({
        text: [ 'DROP SEQUENCE IF EXISTS', data.sequence_name ],
        done: done
      });
    },

    create_table: function(data, done) {
      this.execute({
        text: [
          'CREATE TABLE IF NOT EXISTS', data.table.fullname, '(',
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
        text: [ 'DROP TABLE IF EXISTS', data.table.fullname ],
        done: done
      });
    },

    rename_table: function(data, done) {
      this.execute({
        text: [ 'ALTER TABLE', data.table.fullname, 'RENAME TO', data.to ],
        done: done
      });
    },

    add_column: function(data, done) {
      this.execute({
        text: [ 'ALTER TABLE', data.table.fullname, 'ADD COLUMN', data.column.name, data.column.type ],
        done: done
      });
    },

    remove_column: function(data, done) {
      this.execute({
        text: [ 'ALTER TABLE', data.table.fullname, 'DROP COLUMN', data.column.name ],
        done: done
      });
    },

    change_column: function(data, done) {
      this.execute({
        text: [ 'ALTER TABLE', data.table.fullname, 'ALTER COLUMN', data.column.name, 'TYPE', data.column.type ],
        done: done
      });
    },

    rename_column: function(data, done) {
      this.execute({
        text: [ 'ALTER TABLE', data.table.fullname, 'RENAME COLUMN', data.column.name, 'TO', data.column.new_name ],
        done: done
      });
    },

    add_index: function() { },
    remove_index: function() { },
    add_constraint: function() { },
    remove_constraint: function() { },

    drop_trigger: function(data, done) {
      this.execute({
        text: [ 'DROP TRIGGER IF EXISTS', data.trigger.name, 'ON', data.table.fullname, 'CASCADE' ],
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
            '  PERFORM pg_notify(\'row_modified\', json_build_object(\'schema\', TG_TABLE_SCHEMA, \'table\', TG_TABLE_NAME, \'id\', id, \'type\', TG_OP)::text);',
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
          data.trigger.event, 'ON', data.table.fullname,
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
