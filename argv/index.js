module.exports = function(config) {
  var args = [].slice.call(process.argv, 2);
  var o = {};

  if (Array.isArray(config)) {

    /*
      positional arguments

      $ node {{script}} foo bob ping=pong

      var args = argv([
        { name: 'arg1', valid: 'foo,bar,baz', default: false },
        { name: 'arg2', default: false },
        { name: true, valid: 'pong,bong', default: false },
        { name: 'arg4', valid: 'bill,ben', default: false }
      ]);

      {
        arg1: 'foo',
        arg2: 'bob',
        ping: 'pong',
        arg4: false
      }
    */

    config.forEach((options, index) => {
      var name = options.name;
      var value = options.hasOwnProperty('default') ? options.default : false;
      if (index < args.length) {
        var argument = args[index];
        if (options.name === true) {
          var kvp = argument.split('=');
          name = kvp[0];
          argument = kvp[1];
        }
        if (typeof argument === 'undefined') {
          // default
        } else if (options.valid) {
          value = false;
          var valid = options.valid.split(',');
          if (valid.indexOf(argument) !== -1) {
            value = argument;
          }
        } else {
          value = argument;
        }
      }
      o[name] = value;
    });

  } else {

    /*
      flag & value arguments

      $ node {{script}} --foo --bar baz --bob --fizz --buzz abc

      var args = argv({
        arg1: { flags: 'foo,ben', default: false },
        arg2: { flag: 'bar', default: false },
        bob: { default: false },
        arg3: { flags: 'jon', default: false },
        arg4: { name: 'fizz', default: false },
        arg5: { flag: 'buzz', valid: 'abc,def,ghi', default: false }
      });

      {
        arg1: 'foo',
        arg2: 'baz',
        bob: true,
        arg3: false,
        arg4: true,
        arg5: 'abc'
      }
    */

    for (var key in config) {
      if (config.hasOwnProperty(key)) {
        var options = config[key];
        var value = options.hasOwnProperty('default') ? options.default : false;
        if (options.flag) {
          // named value flag eg --bar baz
          var arg_index = args.indexOf('--' + options.flag);
          if (arg_index !== -1 && ++arg_index < args.length) {
            if (options.valid) {
              var valid = options.valid.split(',');
              if (valid.indexOf(args[arg_index]) !== -1) {
                value = args[arg_index];
              }
            } else {
              value = args[arg_index];
            }
          }
        } else if (options.flags) {
          // named flag (restricted) eg --foo
          var flags = options.flags.split(',');
          for (let i = 0, l = flags.length; i < l; i++) {
            if (args.indexOf('--' + flags[i]) !== -1) {
              // set as boolean or actual flag value (eg --foo)
              value = flags[i] === key ? true : flags[i];
              break;
            }
          }
        } else {
          // named flag eg --bob
          var name = options.name || key;
          if (args.indexOf('--' + name) !== -1) {
            value = true;
          }
        }
        o[key] = value;
      }
    }

  }

  return o;
};
