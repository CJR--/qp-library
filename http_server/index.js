define(module, function(exports, require, make) {

  var net = require('net');
  var http = require('http');
  var fs = require('fs');
  var crypto = require('crypto');
  var domain = require('domain');
  var useragent = require('useragent');
  var mustache = require('mustache');
  var mime = require('mime');
  var qp = require('qp-utility');
  var fss = require('qp-library/fss');
  var fso = require('qp-library/fso');
  var url = require('qp-library/url');
  var exit = require('qp-library/exit');
  var log = require('qp-library/log');
  var socket = require('qp-library/http_server/socket');

  make({

    ns: 'qp-library/http_server',

    name: '',
    port: 80,
    www: '',
    external: {},
    favicon: 'none',
    headers: {},
    cors: {
      preflight: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Methods': 'GET,POST',
        'Access-Control-Allow-Headers': 'SessionId, Content-Type, Accept, X-Requested-With'
      },
      request: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': 'true'
      }
    },
    templates: {},
    server: null,
    enable_sockets: false,

    mime_types: {
      text: mime.lookup('txt'),
      html: mime.lookup('html'),
      css: mime.lookup('css'),
      js: mime.lookup('js'),
      json: mime.lookup('json'),
      ico: mime.lookup('ico')
    },

    handlers: {

      template: function(send, id, data, headers) {
        var template = this.templates[id];
        if (template) {
          send.data(mustache.render(fss.read(template.path), data), this.mime(template.type), headers);
        }
      },

      text: function(send, msg, headers) {
        send.data(msg, this.mime('text'), headers);
      },

      html: function(send, html, headers) {
        send.data(html, this.mime('html'), headers);
      },

      data: function(send, data, mime, headers) {
        send(200, { mime: mime, size: Buffer.byteLength(data) }, data, headers);
      },

      file: function(send, file, headers) {
        if (file.is_file && file.exists) {
          send(200, file, fs.createReadStream(file.fullname), headers);
        } else {
          send(404);
        }
      },

      json: function(send, o, headers) {
        var data = JSON.stringify(o, null, 2);
        send(200, { mime: this.mime('json'), size: Buffer.byteLength(data) }, data, headers);
      }

    },

    init: function(config) {
      log.clear();
      exit.handler(this.on_stop);
      if (config.on_request) this.on_request = config.on_request.bind(this);
      this.server = this.create_server_domain();
      if (this.enable_sockets) this.create_socket_server();
      this.server.listen(this.port);
      this.on_setup();
      this.on_start();
    },

    add_handler: function(key, handler) {
      this.handlers[key] = handler.bind(this);
    },

    create_server: function() {
      process.on('uncaughtException', this.on_error.bind(this, undefined, undefined));
      return http.createServer(function(req, res) {
        this.run_request.call(this, req, res);
      }.bind(this));
    },

    create_server_domain: function() {
      return http.createServer(function(req, res) {
        var d = domain.create();
        d.on('error', this.on_error.bind(this, req, res));
        d.add(req);
        d.add(res);
        d.run(this.run_request.bind(this, req, res));
      }.bind(this));
    },

    mime: function(type) {
      return this.mime_types[type] || (this.mime_types[type] = mime.lookup(type));
    },

    read_data: function(req, done) {
      var post_data = '';
      req.on('data', function(data) { post_data += data; });
      req.on('end', function() { done.call(this, null, post_data); }.bind(this));
    },

    read_json: function(req, done) {
      var json = '';
      req.on('data', function(data) { json += data; });
      req.on('end', function() { done.call(this, null, JSON.parse(json)); }.bind(this));
    },

    read_agent: function(req) {
      req.ua = useragent.parse(req.headers['user-agent']);
    },

    ip_address: function(req) {
      var ip_address;
      var forwarded = req.headers['x-forwarded-for'];
      if (forwarded) {
        ip_address = forwarded.split(',')[0];
      }
      return ip_address || req.connection.remoteAddress;
    },

    user_agent: function(req) { return req.headers['user-agent']; },

    session_id: function(o) {
      if (qp.is(o, 'url')) {
        return o.get_params().sid || '';
      } else {
        return o.headers['session-id'] || '';
      }
    },

    run_request: function(req, res) {
      var req_url = url.create({ url: req.url });
      var send = this.send.bind(this, req_url, req, res);
      qp.each(this.handlers, function(handler, key) {
        send[key] = handler.bind(this, send);
      }, this);
      if (req.method === 'GET' && req_url.equals('/favicon.ico') && this.favicon === 'none') {
        send(200, { mime: this.mime('ico'), size: 0 }, '');
      } else {
        this.on_request(req.method, req_url, send, req, res);
      }
    },

    send: function(req_url, req, res, status, stat, data, headers) {
      if (!res.done) {
        res.done = true;
        log(log.magenta(res.statusCode), log.blue(qp.rpad(req.method, 4)), req_url.fullname);
        if (arguments.length === 4 && !data) {
          res.writeHead(204, this.headers);
          res.end();
        } else {
          res.writeHead(status, this.create_headers(stat, headers));
          if (qp.is(data, 'string')) {
            res.write(data);
            res.end();
          } else if (qp.is(data, 'readstream')) {
            data.pipe(res);
          } else {
            res.end();
          }
        }
      }
    },

    create_headers: function(stat, headers) {
      if (!stat) { return this.headers; }
      stat.mtime = stat.mtime || qp.now();
      return qp.assign({
        'ETag': JSON.stringify([stat.ino || 'x', stat.size, stat.mtime.getTime()].join('-')),
        'Last-Modified': stat.mtime.toUTCString(),
        'Content-Type': stat.mime,
        'Content-Length': stat.size
      }, this.headers, headers);
    },

    on_setup: function() { },

    on_request: function(method, url, send) { send(204); },

    on_start: function() {
      log(log.blue_white(' *** %s:%s *** '), this.name, this.port);
    },

    on_stop: function() {
      log('Stopped');
      process.exit(0);
    },

    on_error: function(http_request, http_response, error) {
      try {
        this.server.close();
        log('Exception:', http_request ? http_request.url : ' ...');
        log(error.stack);
        if (http_response) {
          http_response.statusCode = 500;
          http_response.setHeader('content-type', 'text/plain');
          http_response.end(error.stack);
        }
      } catch (error1) {
        log(error1.stack);
      } finally {
        log('Terminated');
        process.exit(1);
      }
    }

  });

});
