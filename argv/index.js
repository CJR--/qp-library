module.exports = function(config) {

  var args = [].slice.call(process.argv, 2);
  var options = {};

  for (var key in config) {
    if (config.hasOwnProperty(key)) {
      options[key] = config[key].dfault;
      var values = config[key].options.split(',');
      for (var i = 0, l = values.length; i < l; i++) {
        if (args.indexOf('--' + values[i]) !== -1) {
          options[key] = values[i];
          break;
        }
      }
    }
  }

  return options;

};
