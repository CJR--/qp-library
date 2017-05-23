define(module, function(exports, require) {

  var qp = require('qp-utility');

  qp.make(exports, {

    ns: 'qp-library/postgres/txn',

    connection: null,

    init: function(o) { },

    begin: function(done) {
      this.connection.query('BEGIN', (error) => {
        if (error) this.rollback(done); else done();
      });
    },

    rollback: function(done) {
      this.connection.query('ROLLBACK', (error) => {
        done(error);
        this.reset();
      });
    },

    commit: function(done) {
      this.connection.query('COMMIT', (error) => {
        done(error);
        this.reset();
      });
    }

  });

});
