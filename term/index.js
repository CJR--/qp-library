define(module, function(exports, require) {

  var code = {
    hex: [
      '\u0000', '\u0001', '\u0002', '\u0003', '\u0004', '\u0005', '\u0006', '\u0007', '\u0008', '\u0009', '\u000A', '\u000B',
      '\u000C', '\u000D', '\u000E', '\u000F', '\u0010', '\u0011', '\u0012', '\u0013', '\u0014', '\u0015', '\u0016', '\u0017',
      '\u0018', '\u0019', '\u001A', '\u001B', '\u001C', '\u001D', '\u001E', '\u001F', '\u0020', '\u0021', '\u0022', '\u0023',
      '\u0024', '\u0025', '\u0026', '\u0027', '\u0028', '\u0029', '\u002A', '\u002B', '\u002C', '\u002D', '\u002E', '\u002F',
      '\u0030', '\u0031', '\u0032', '\u0033', '\u0034', '\u0035', '\u0036', '\u0037', '\u0038', '\u0039', '\u003A', '\u003B',
      '\u003C', '\u003D', '\u003E', '\u003F', '\u0040', '\u0041', '\u0042', '\u0043', '\u0044', '\u0045', '\u0046', '\u0047',
      '\u0048', '\u0049', '\u004A', '\u004B', '\u004C', '\u004D', '\u004E', '\u004F', '\u0050', '\u0051', '\u0052', '\u0053',
      '\u0054', '\u0055', '\u0056', '\u0057', '\u0058', '\u0059', '\u005A', '\u005B', '\u005C', '\u005D', '\u005E', '\u005F',
      '\u0060', '\u0061', '\u0062', '\u0063', '\u0064', '\u0065', '\u0066', '\u0067', '\u0068', '\u0069', '\u006A', '\u006B',
      '\u006C', '\u006D', '\u006E', '\u006F', '\u0070', '\u0071', '\u0072', '\u0073', '\u0074', '\u0075', '\u0076', '\u0077',
      '\u0078', '\u0079', '\u007A', '\u007B', '\u007C', '\u007D', '\u007E', '\u007F'
    ],
    key: [
      'NULL', 'SOH', 'STX', 'ETX', 'EOT', 'ENQ', 'ACK', 'BEL', 'BS', 'HT', 'LF', 'VT',
      'FF', 'CR', 'SO', 'SI', 'DLE', 'DC1', 'DC2', 'DC3', 'DC4', 'NAK', 'SYN', 'ETB',
      'CAN', 'EM', 'SUB', 'ESC', 'FS', 'GS', 'RS', 'US', 'space', '!', '"', '#',
      '$', '%', '&', "'", '(', ')', '*', '+', ',', '-', '.', '/',
      '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', ':', ';',
      '<', '=', '>', '?', '@', 'A', 'B', 'C', 'D', 'E', 'F', 'G',
      'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S',
      'T', 'U', 'V', 'W', 'X', 'Y', 'Z', '[', '\\', ']', '^', '_',
      '`', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k',
      'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w',
      'x', 'y', 'z', '{', '|', '}', '~', 'delete'
    ]
  };

  function blue_white(s) { return `\x1b[47m\x1b[34m${s}\x1b[0m\x1b[0m`; }
  function red(s)        { return `\x1b[31m${s}\x1b[0m`; }
  function green(s)      { return `\x1b[32m${s}\x1b[0m`; }
  function blue(s)       { return `\x1b[34m${s}\x1b[0m`; }


  function get_key(hex) {
    var index = code.hex.indexOf(hex);
    return index > -1 ? code.key[index] : '';
  }

  function get_hex(key) {
    var index = code.key.indexOf(key);
    return index > -1 ? code.hex[index] : '';
  }

  var child_process = require('child_process');
  var readline = require('readline');
  var qp = require('qp-utility');

  qp.module(exports, {

    blue_white: blue_white,
    red: red,
    green: green,
    blue: blue,

    exit: function(code) { process.exit(code || 0); },

    set_title: function(title) {
      process.stdout.write(String.fromCharCode(27) + ']0;' + title + String.fromCharCode(7));
    },

    clear: function() {
      if (process.platform === 'win32') {
        process.stdout.write('\033c');
      } else {
        process.stdout.write('\u001B[2J\u001B[0;0f');
      }
    },

    log_title: function() { console.log(blue_white(qp.arg(arguments).join(''))); },
    log: function() { console.log.apply(console, arguments); },
    error: function() { console.error.apply(console, arguments); },
    line: function() { console.log(); },

    done: function(error) {
      if (typeof error === 'string') {
        console.error.apply(console, arguments);
      } else if (typeof error === 'object' && error !== null) {
        console.error(error.message);
      } else {
        console.log('Process Complete');
      }
      process.exit(error ? -1 : 0);
    },

    run: function(command, options) {
      child_process.execSync(command, Object.assign({ stdio: [0,1,2] }, options));
    },

    keypress: function(handler) {
      if (process.stdin.setRawMode) {
        process.stdin.setRawMode(true);
        process.stdin.setEncoding('utf8');
        process.stdin.on('data', chr => {
          var key = get_key(chr);
          if (key === 'ETX') process.exit(0);
          handler(key, chr);
        });
        process.stdin.resume();
      }
    },

    /* USER INPUT */

    input: function() {
      var items = qp.arg(arguments);
      var done = items.pop();
      var results = {};
      var next_input = () => {
        if (items.length) {
          var item = items.shift();
          var action = item.key === 'confirm' ? 'confirm' : item.options ? 'pick' : 'ask';
          this[action](item, (error, result) => {
            qp.override(results, result);
            if (error) return done(error, results); else next_input();
          });
        } else {
          done(null, results);
        }
      };
      next_input();
    },

    confirm: function(data, done) {
      var prompt = readline.createInterface({ input: process.stdin, output: process.stdout });
      if (data.default) data.default_text =` (${data.default})? `;
      prompt.question(blue(data.question + (data.default_text || '? ')), (answer) => {
        prompt.close();
        answer = qp.lower(answer || (data.default || 'n')).slice(0, 1);
        done(null, { [data.key]: answer === 'y' });
      });
    },

    ask: function(data, done) {
      var prompt = readline.createInterface({ input: process.stdin, output: process.stdout });
      if (data.default) data.default_text =` (${data.default}): `;
      prompt.question(green(data.question + (data.default_text || ': ')), (answer) => {
        prompt.close();
        done(null, { [data.key]: answer || data.default || '' });
      });
    },

    pick: function(data, done) {
      if (data.title) console.log(data.title);
      data.default = {
        option: null,
        text: data.default ? ` (${data.default}): ` : ': ',
        value: data.default
      };
      data.options.forEach((option, i) => {
        option.key = option.key || i + 1;
        console.log(`${option.key} - ${option.text}`);
        if (option.default) {
          data.default.option = option;
          data.default.text = ` (${option.text}): `;
        }
      });
      var prompt = readline.createInterface({ input: process.stdin, output: process.stdout });
      prompt.question(green(data.question + data.default.text), (answer) => {
        prompt.close();
        if (data.multi) {
          if (answer === '') answer = data.default.value || '';
          var options = qp.select(answer.split(''), key => {
            var option = data.options.find(option => qp.lower(option.key) === qp.lower(key));
            return qp.get(option, 'value', option);
          });
          done(null, { [data.key]: options });
        } else {
          var option = data.options.find(option => qp.lower(option.key) === qp.lower(answer)) || null;
          if (data.default.option && !option) {
            done(null, { [data.key]: qp.get(data.default.option, 'value', data.default.option) });
          } else {
            done(null, { [data.key]: qp.get(option, 'value', option) });
          }
        }
      });
    },

  });

});
