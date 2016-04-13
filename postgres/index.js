define(module, (exports, require, make) => {

  var named_param_re = /\:[-a-zA-Z0-9_]+/g;

  make({
  
    ns: 'qp-library/postgres',
    
    connection: null,
    
    init: function(o) {
      this.connection = o.connection;
    },
    
    select: function(sql, params, done) { },
    
    select_all: function(sql, params, done) { },
    
    insert: function(sql, params, done) { },
    
    update: function(sql, params, done) { },
    
    delete: function(sql, params, done) { },
    
    execute: function(sql, params, done) { },
    
    prepare_sql: function(config) {
      var sql = config.text;
      var values = config.values || [];
      var params = config.params || [];
      sql = sql.replace(named_param_re, function(match) {
        values.push(params[match.slice(1)]);
        return '$' + values.length;
      });      
      return { text: sql, values: values, name: config.name };
    }  
  
  });

});