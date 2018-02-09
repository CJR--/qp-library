define(module, function(exports, require) {

  var http = require('http');
  var fs = require('fs');
  var domain = require('domain');
  var useragent = require('useragent');
  var mustache = require('mustache');
  var mime = require('mime');
  var qp = require('qp-utility');
  var fss = require('qp-library/fss');
  var url = require('qp-library/url');
  var log = require('qp-library/log');
  var connections = require('qp-library/http_server/connections');

  qp.make(exports, {

    ns: 'qp-library/http_server',

    title: '',
    name: '',
    port: 80,
    www: '',
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

    http_server: null,
    is_closing: false,
    enable_domain: true,
    enable_session_cookie: false,
    session_cookie_secure: false,
    session_cookie_domain: false,
    session_cookie_path: false,
    session_cookie_expires: false,

    mime_types: {
      text: mime.getType('txt'),
      html: mime.getType('html'),
      css: mime.getType('css'),
      js: mime.getType('js'),
      json: mime.getType('json'),
      ico: mime.getType('ico')
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
      },

      redirect: function(send, location) {
        send(302, null, null, { 'Location': location });
      }

    },

    start: function() {
      if (!this.http_server) this.create_server();
      process.on('SIGTERM', this.stop);
      connections.monitor(this.http_server);
      this.http_server.listen(this.port);
      this.on_start();
    },

    stop: function(done) {
      this.http_server.close(() => {
        this.on_stop(done);
      });
      connections.close_all(true);
    },

    add_handler: function(key, handler) {
      this.handlers[key] = handler.bind(this);
    },

    create_server: function() {
      if (this.enable_domain) {
        this.http_server = http.createServer(function(req, res) {
          var d = domain.create();
          d.on('error', this.on_error.bind(this, req, res));
          d.add(req);
          d.add(res);
          d.run(this.run_request.bind(this, req, res));
        }.bind(this));
      } else {
        process.on('uncaughtException', this.on_error.bind(this, undefined, undefined));
        this.http_server = http.createServer(function(req, res) {
          this.run_request.call(this, req, res);
        }.bind(this));
      }
    },

    mime: function(type) {
      return this.mime_types[type] || (this.mime_types[type] = mime.getType(type));
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

    set_session_cookie: function(res, sid) {
      if (this.enable_session_cookie) {
        var cookie = ['Session-Id=' + sid];
        if (this.session_cookie_expires) {
          var expires_dt = new Date();
          expires_dt.setTime(expires_dt.getTime() + this.session_cookie_expires);
          cookie.push('Expires=' + expires_dt.toUTCString());
        }
        if (this.session_cookie_path) cookie.push('Path=' + this.session_cookie_path);
        if (this.session_cookie_domain) cookie.push('Domain=' + this.session_cookie_domain);
        cookie.push('HttpOnly');
        cookie.push('SameSite=Strict');
        res.setHeader('Set-Cookie', cookie.join('; '));
      }
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
      } else if (o.headers['session-id']) {
        return o.headers['session-id'] || '';
      } else if (this.enable_session_cookie) {
        var cookie = o.headers['cookie'] || '';
        var results = cookie.match('Session-Id' + '=(.*?)(;|$)');
        return results ? results[1] : '';
      } else {
        return '';
      }
    },

    status: function(code, include_code) {
      var description = http.STATUS_CODES[code] || '';
      return (include_code ? code : '') + (description ? ' - ' + description : '');
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
        this.log_request(status, req.method, req_url.fullname);
        if (arguments.length === 3) {
          res.writeHead(204, this.headers);
          res.end();
        } else if (arguments.length === 4) {
          res.writeHead(status, this.create_headers({ mime: this.mime('text'), size: 0 }));
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

    log_request: function(status, method, url) {
      var status_color = status < 200 ? 'magenta' : status < 300 ? 'green' : status < 400 ? 'yellow' : 'white_red';
      var method_color = status >= 400 ? 'white_red' : 'blue';
      var url_color = status >= 400 ? 'white_red' : 'white';
      log(log[status_color](status), log[method_color](qp.rpad(method, 4)), log[url_color](url));
    },

    create_headers: function(stat, headers) {
      if (!stat) { return qp.assign({}, this.headers, headers); }
      stat.mtime = stat.mtime || qp.now();
      return qp.assign({
        'ETag': JSON.stringify([stat.ino || 'x', stat.size, stat.mtime.getTime()].join('-')),
        'Last-Modified': stat.mtime.toUTCString(),
        'Content-Type': stat.mime,
        'Content-Length': stat.size
      }, this.headers, headers);
    },

    on_request: function(method, url, send) { send(204); },

    on_start: function() { },

    on_stop: function(done) { done(); },

    on_error: function(http_request, http_response, error) {
      try {
        this.http_server.close();
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
