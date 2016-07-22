define(module, function(exports, require, make) {

  var ws = require('ws');
  var qp = require('qp-utility');
  var log = require('qp-library/log');

  make({

    ns: 'qp-library/http_server/socket',

    socket: null,
    sockets: [],

    init: function() { },

    create_socket_server: function() {
      var server = this.socket = new ws.Server({ server: this.server });
      server.on('headers', (headers) => log('SocketServer - Headers', headers));
      server.on('connection', (socket) => {
        this.sockets.push({ id: socket.id });
        log('Websocket - Connection - ', socket.id);
        socket.on('message', (data, flags) => {
          log('Websocket - Message');
          var incoming = JSON.parse(data);
          this.on_message.call(this, incoming);
        });
        socket.on('close', (code, message) => {
          log('Websocket - ', code, ' - ', message);
        });
        socket.on('error', (error) => log.error('Websocket', error));
        socket.on('ping', (data, flags) => log('Websocket - Ping'));
        socket.on('pong', (data, flags) => log('Websocket - Pong'));
      });
      server.on('close', (socket) => {
        log('SocketServer - Close', socket.id);
      });
      server.on('error', (error) => log.error('SocketServer', error));
      return server;
    },

    on_message: function(message) { }

  });

});
