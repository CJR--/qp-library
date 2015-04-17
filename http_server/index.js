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

      template: function(send, id, data) {
        var template = this.templates[id];
        if (template) {
          send.data(mustache.render(fss.read(template.path), data), this.mime(template.type));
        }
      },

      text: function(send, msg) {
        send.data(msg, this.mime('text'));
      },

      data: function(send, data, mime) {
        send(200, { mime: mime, size: Buffer.byteLength(data) }, data);
      },

      file: function(send, file) {
        if (file.is_file && file.exists) {
          send(200, file, fs.createReadStream(file.fullname));
        }
      }

    },

    init: function(config) {
      log.clear();
      exit.handler(this.on_stop);
      this.on_request = config.on_request;
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

    send: function(res, status, headers, data) {
      if (!res.done) {
        res.done = true;
        if (arguments.length === 3 && !data) {
          res.writeHead(204, this.headers);
          res.end();
        } else {
          res.writeHead(status, this.create_headers(headers));
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

    create_headers: function(opt) {
      if (!opt) { return this.headers; }
      opt.mtime = opt.mtime || qp.now();
      return qp.assign({
        'ETag': JSON.stringify([opt.ino || 'x', opt.size, opt.mtime.getTime()].join('-')),
        'Last-Modified': opt.mtime.toUTCString(),
        'Content-Type': opt.mime,
        'Content-Length': opt.size
      }, this.headers);
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
