define(module, function(exports, require, make) {

  var ws = require('ws');
  var qp = require('qp-utility');
  var url = require('qp-library/url');
  var log = require('qp-library/log');

  make({

    ns: 'qp-library/http_server/socket',

    websocket_server: null,

    init: function() { },

    create_socket_server: function() {
      var server = this.websocket_server = new ws.Server({ server: this.server });

      server.on('error', this.socket_error);
      server.on('connection', (connection) => {
        var request = connection.upgradeReq;
        var socket_id = request.headers['sec-websocket-key'] || '';
        connection.on('error', this.socket_error);
        connection.on('close', (code, message) => log.socket('CLOSE', code, message || ''));

        var socket = {
          id: socket_id,
          ua: request.headers['user-agent'] || '',
          url: url.create({ url: request.url }),
          version: request.headers['sec-websocket-version'] || '',
          protocols: (request.headers['sec-websocket-protocol'] || '').split(', ')
        };
        socket.close = (code, message) => {
          connection.close(code, message || '');
        };
        socket.send = function send(socket, data) {
          log.socket('MSG_OUT', qp.stringify(data, true));
          if (socket.json) data = JSON.stringify(data);
          connection.send(data);
        }.bind(this, socket);
        log.socket('CONNECT ', socket.url.fullname);
        if (this.on_connect(socket.url, socket)) {
          connection.on('message', (data, flags) => {
            if (socket.json) data = JSON.parse(data);
            log.socket('MSG_IN', qp.stringify(data, true));
            this.on_message.call(this, socket.url, data, socket);
          });
        } else {
          connection.close(1002, 'Connection Denied');
        }
      });
      return server;
    },

    on_connect: function(url, socket) { return true; },
    on_message: function(url, message, socket) { },
    socket_error: function(e) { log.socket('SOCKET  ', qp.upper(e.name) + ':', e.message); }

  });

});


/*

http://www.faqs.org/rfcs/rfc6455.html

1000

  1000 indicates a normal closure, meaning that the purpose for
  which the connection was established has been fulfilled.

1001

  1001 indicates that an endpoint is "going away", such as a server
  going down or a browser having navigated away from a page.

1002

  1002 indicates that an endpoint is terminating the connection due
  to a protocol error.

1003

  1003 indicates that an endpoint is terminating the connection
  because it has received a type of data it cannot accept (e.g., an
  endpoint that understands only text data MAY send this if it
  receives a binary message).

1004

  Reserved.  The specific meaning might be defined in the future.

1005

  1005 is a reserved value and MUST NOT be set as a status code in a
  Close control frame by an endpoint.  It is designated for use in
  applications expecting a status code to indicate that no status
  code was actually present.

1006

  1006 is a reserved value and MUST NOT be set as a status code in a
  Close control frame by an endpoint.  It is designated for use in
  applications expecting a status code to indicate that the
  connection was closed abnormally, e.g., without sending or
  receiving a Close control frame.

1007

  1007 indicates that an endpoint is terminating the connection
  because it has received data within a message that was not
  consistent with the type of the message (e.g., non-UTF-8 [RFC3629]
  data within a text message).

1008

  1008 indicates that an endpoint is terminating the connection
  because it has received a message that violates its policy.  This
  is a generic status code that can be returned when there is no
  other more suitable status code (e.g., 1003 or 1009) or if there
  is a need to hide specific details about the policy.

1009

  1009 indicates that an endpoint is terminating the connection
  because it has received a message that is too big for it to
  process.

1010

  1010 indicates that an endpoint (client) is terminating the
  connection because it has expected the server to negotiate one or
  more extension, but the server didn't return them in the response
  message of the WebSocket handshake.  The list of extensions that
  are needed SHOULD appear in the /reason/ part of the Close frame.
  Note that this status code is not used by the server, because it
  can fail the WebSocket handshake instead.

1011

  1011 indicates that a server is terminating the connection because
  it encountered an unexpected condition that prevented it from
  fulfilling the request.

1015

  1015 is a reserved value and MUST NOT be set as a status code in a
  Close control frame by an endpoint.  It is designated for use in
  applications expecting a status code to indicate that the
  connection was closed due to a failure to perform a TLS handshake
  (e.g., the server certificate can't be verified).

*/
