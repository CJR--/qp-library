define(module, function(exports, require, make) {

  // http://www.faqs.org/rfcs/rfc6455.html

  var qp = require('qp-utility');
  var url = require('qp-library/url');
  var log = require('qp-library/log');

  make({

    ns: 'qp-library/websocket',

    ws: null,

    key: '',
    session_id: '',
    user_id: '',
    ua: '',
    url: '',
    version: '',
    channel: '',
    protocols: null,

    json: false,

    init: function(options) {
      this.ws = options.ws;
      this.parse_headers(this.ws.upgradeReq.headers);
      this.parse_request(this.ws.upgradeReq);
      this.ws.on('close', () => {
        this.url = null;
        this.ws = null;
      });
    },

    parse_headers: function(headers) {
      this.key = headers['sec-websocket-key'] || '';
      this.ua = headers['user-agent'] || '';
      this.version = headers['sec-websocket-version'] || '';
      this.protocols = (headers['sec-websocket-protocol'] || '').split(', ');
      this.json = qp.contains(this.protocols, 'json-message');
    },

    parse_request: function(request) {
      this.url = url.create({ url: request.url });
      if (this.url.parts.length === 2) this.channel = this.url.parts[1];
      if (this.url.parts.length === 3) {
        this.session_id = this.url.parts[1];
        this.channel = this.url.parts[2];
      }
    },

    send: function(data, options, done) {
      if (this.ws) {
        log.socket('SEND', '#' + this.user_id, qp.stringify(data));
        if (this.json) data = JSON.stringify(data, null, 2);
        this.ws.send(data, options, done);
      } else {
        log.socket('SEND', 'Failed. Socket closed;', this.key);
      }
    },

    close: function(code, message) {
      this.ws.close(code, message || '');
    }

  });

});
