define(module, (exports, require, make) => {

  var wss = require('ws').Server;
  var qp = require('qp-utility');
  var url = require('qp-library/url');
  var log = require('qp-library/log');
  var websocket = require('qp-library/websocket');

  make({

    ns: 'qp-library/websocket/server',

    wss: null,
    sockets: [],

    on_connect: null,
    on_connected: null,
    on_message: null,

    init: function(options) {
      this.wss = new wss({
        server: options.http_server,
        clientTracking: false,
        verifyClient: this.on_socket_connect
      });
      this.wss.on('connection', this.on_socket_connected);
    },

    close: function() { },

    on_socket_connect: function(info, done) {
      if (this.on_connect) {
        var req_url = url.create({ url: info.req.url });
        this.on_connect(req_url, info.req, function(error, result) {
          if (done && error) {
            done(false, error.code, error.message);
          } else if (done) {
            done(true);
          }
        });
      } else if (done) {
        done(true);
      }
    },

    on_socket_connected: function(ws) {
      var socket = websocket.create({ ws: ws });
      ws.on('error', (e) => this.on_socket_error(socket, e));
      // ws.on('open', (e) => this.on_socket_open(socket, e));
      ws.on('close', (code, message) => this.on_socket_close(socket, code, message));
      if (this.on_connected) {
        this.on_connected(socket, (error, connect) => {
          if (error) { socket.close(error.code, error.message); } else {
            this.on_socket_open(socket);
            ws.on('message', (data, flags) => this.on_socket_message(socket, data, flags));
          }
        });
      } else {
        this.on_socket_open(socket);
        ws.on('message', (data, flags) => this.on_socket_message(socket, data, flags));
      }
    },

    on_socket_message: function(socket, data, flags) {
      if (socket.json) data = JSON.parse(data);
      log.socket('MESSAGE', qp.stringify(data));
      if (this.on_message) {
        this.on_message(socket, data, function(error, result) {
          if (error) return socket.send(error); else socket.send(result);
        });
      }
    },

    on_socket_error: function(socket, e) {
      log.socket('ERROR', qp.upper(e.name) + ':', e.message);
    },

    on_socket_open: function(socket, e) {
      log.socket('OPEN', socket.channel);
      qp.push(this.sockets, socket);
    },

    on_socket_close: function(socket, code, message) {
      log.socket('CLOSE', code, message || '');
      qp.remove(this.sockets, socket);
    }

  });

});
