define(module, function(exports, require) {

  // http://www.faqs.org/rfcs/rfc6455.html

  var qp = require('qp-utility');
  var log = require('qp-library/log');

  qp.make(exports, {

    ns: 'qp-library/websocket',

    socket: null,

    id: 0,
    key: '',
    session_id: '',
    ua: '',
    version: '',
    channel: '',
    protocols: null,
    log: { },

    json: false,

    init: function(options) {
      this.socket = options.socket;
      this.parse_headers(options.headers);
      this.parse_url(options.url);
      this.socket.on('close', () => {
        this.url = null;
        this.socket = null;
      });
    },

    parse_headers: function(headers) {
      this.key = headers['sec-websocket-key'] || '';
      this.ua = headers['user-agent'] || '';
      this.version = headers['sec-websocket-version'] || '';
      this.protocols = (headers['sec-websocket-protocol'] || '').split(', ');
      this.json = qp.contains(this.protocols, 'json-message');
    },

    parse_url: function(url) {
      if (url.parts.length === 2) this.channel = url.parts[1];
      if (url.parts.length === 3) {
        this.session_id = url.parts[1];
        this.channel = url.parts[2];
      }
    },
    
    send: function(data, options, done) {
      if (this.socket) {
        if (this.log.websocket) log.socket('SEND', '#' + (this.user_id || this.id), qp.stringify(data));
        if (this.json) data = JSON.stringify(data, null, 2);
        this.socket.send(data, options, done);
      } else {
        if (this.log.websocket) log.socket('SEND', 'Failed. Socket closed;', this.key);
      }
    },

    close: function(code, message) {
      if (this.socket) {
        this.socket.close(code, message || '');
      }
    }

  });

});
