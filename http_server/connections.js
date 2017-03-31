define(module, function(exports, require) {

  const CONNECTION = 'qp_connection';

  var qp = require('qp-utility');
  var sockets = {};
  var socket_id = 1;
  var is_closing = false;

  function close_socket(socket, force) {
    var connection = socket[CONNECTION];
    if (force || (connection.idle && is_closing)) {
      delete sockets[connection.id];
      socket.destroy();
    }
  }

  exports({

    monitor: function(http_server) {

      http_server.on('connection', (socket) => {
        var id = socket_id++;
        socket[CONNECTION] = { id: id, idle: true };
        sockets[id] = socket;
        socket.on('close', () => close_socket(socket));
      });

      http_server.on('request', (req, res) => {
        var connection = req.socket[CONNECTION];
        connection.idle = false;
        res.on('finish', () => {
          connection.idle = true;
          close_socket(req.socket);
        });
      });

    },

    close_all: function(force) {
      is_closing = true;
      qp.each_own(sockets, (socket) => close_socket(socket, force));
    }

  });

});
