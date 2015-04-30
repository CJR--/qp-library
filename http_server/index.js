define(module, function(exports, require) {

  var http = require('http');
  var fs = require('fs');
  var domain = require('domain');
  var mustache = require('mustache');
  var mime = require('mime');
  var qp = require('qp-utility');
  var fss = require('qp-library/fss');
  var fso = require('qp-library/fso');
  var url = require('qp-library/url');
  var exit = require('qp-library/exit');
  var log = require('qp-library/log');

  exports('qp-library/http_server', {

    name: '',
    port: 80,
    www: '',
    headers: {},
    templates: {},
    server: null,

    mime_types: {
      text: mime.lookup('txt'),
      html: mime.lookup('html'),
      css: mime.lookup('css'),
      js: mime.lookup('js'),
      json: mime.lookup('json')
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

      data: function(send, data, mime, headers) {
        send(200, { mime: mime, size: Buffer.byteLength(data) }, data, headers);
      },

      file: function(send, file, headers) {
        if (file.is_file && file.exists) {
          send(200, file, fs.createReadStream(file.fullname), headers);
        }
      },

      json: function(send, o, headers) {
        var data = JSON.stringify(o);
        send(200, { mime: this.mime('json'), size: Buffer.byteLength(data) }, data, headers);
      }

    },

    init: function(config) {
      log.clear();
      exit.handler(this.on_stop);
      if (config.on_request) this.on_request = config.on_request.bind(this);
      this.server = this.create_server();
      this.server.listen(this.port);
      this.on_start();
    },

    create_server: function() {
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

    run_request: function(req, res) {
      var send = this.send.bind(this, res);
      qp.each(this.handlers, function(handler, key) {
        send[key] = handler.bind(this, send);
      }, this);
      var req_url = url.create({ url: req.url });
      this.on_request(req.method, req_url, send, req, res);
      if (!res.done) { send(204); }
      log(log.magenta(res.statusCode), log.blue(req.method), req_url.fullname);
    },

    send: function(res, status, stat, data, headers) {
      if (!res.done) {
        res.done = true;
        if (arguments.length === 3 && !data) {
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

    on_request: function(method, url, send) { send(204); },

    on_start: function() {
      log(log.blue_white(' *** %s:%s *** '), this.name, this.port);
    },

    on_stop: function() {
      log('Stopped');
      process.exit(1);
    },

    on_error: function(http_request, http_response, error) {
      try {
        this.server.close();
        log('Exception:', http_request.url);
        log(error.stack);
        http_response.statusCode = 500;
        http_response.setHeader('content-type', 'text/plain');
        http_response.end(error.stack);
      } catch (error1) {
        log(error1.stack);
      } finally {
        log('Terminated');
        process.exit(1);
      }
    }

  }, qp.make);

});
