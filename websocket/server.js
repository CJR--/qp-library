define(module, (exports, require) => {

  var wss = require('ws').Server;
  var qp = require('qp-utility');
  var url = require('qp-library/url');
  var log = require('qp-library/log');
  var websocket = require('qp-library/websocket');

  qp.make(exports, {

    ns: 'qp-library/websocket/server',

    wss: null,
    sockets: [],
    log: { },

    on_connect: null,
    on_connected: null,
    on_message: null,

    init: function(options) {
      this.wss = new wss({
        server: options.http_server,
        port: options.port,
        clientTracking: false,
        verifyClient: this.on_socket_connect
      });
      this.wss.on('connection', this.on_socket_connected);
    },

    close: function(done) {
      qp.each(this.sockets, (socket) => socket.close());
      this.wss.close(done);
    },

    get_id: function() { return this.id++; },

    on_socket_connect: function(info, done) {
      if (this.on_connect) {
        var req_url = url.create({ url: info.req.url });
        this.on_connect(req_url, info.req, function(error, result) {
          if (done && error) {
            done(false, error.code, error.message);
          } else if (done) {
            done(error === null);
          }
        });
      } else if (done) {
        done(true);
      }
    },

    on_socket_connected: function(ws, req) {
      var req_url = url.create({ url: req.url });
      var socket = websocket.create({ id: qp.id(), socket: ws, url: req_url, headers: req.headers });
      ws.on('error', (e) => this.on_socket_error(socket, e));
      ws.on('close', (code, message) => this.on_socket_close(socket, code, message));
      if (this.on_connected) {
        this.on_connected(socket, (error, settings) => {
          if (error) {
            socket.close(error.code, error.message);
          } else {
            qp.merge(socket, settings);
            this.on_socket_open(socket);
            ws.on('message', data => this.on_socket_message(socket, data));
          }
        });
      } else {
        this.on_socket_open(socket);
        ws.on('message', data => this.on_socket_message(socket, data));
      }
    },

    on_socket_message: function(socket, data) {
      if (socket.json) data = JSON.parse(data);
      if (this.log.websocket) log.socket('MSG', qp.stringify(data));
      if (this.on_message) {
        this.on_message(socket, data, function(error, result) {
          if (error) socket.send(error); else socket.send(result);
        });
      }
    },

    on_socket_error: function(socket, e) {
      log.socket('ERROR', qp.upper(e.name) + ':', e.message);
    },

    on_socket_open: function(socket, e) {
      qp.push(this.sockets, socket);
      if (this.log.websocket) log.socket('OPEN', qp.stringify({ id: socket.id, total: this.sockets.length, name: socket.channel }));
    },

    on_socket_close: function(socket, code, message) {
      qp.remove(this.sockets, socket);
      if (this.log.websocket) log.socket('SHUT', qp.stringify({ id: socket.id, total: this.sockets.length, code: code, name: socket.channel }));
    }

  });

});
