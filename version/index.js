var fs = require('fs');
var path = require('path');
var semver = require('semver');

module.exports = function(bump, filename) {
  filename = filename || 'package.json';
  filename = path.join(process.cwd(), filename);
  var package_file = JSON.parse(fs.readFileSync(filename));
  var version = semver.valid(package_file.version);
  if (version) {
    if (bump) {
      if (bump === 'major' || bump === 'minor' || bump === 'patch') {
        package_file.version = semver.inc(version, bump);
      }
      if (bump === 'major' || bump === 'minor' || bump === 'patch') {
        fs.writeFileSync(filename, JSON.stringify(package_file, null, '  '));
      } else if (bump === 'bump') {
        var stat = fs.statSync(filename);
        var time = (new Date()).getTime();
        fs.utimesSync(filename, stat.atime, time);
      }
      return { from: version, to: package_file.version, bump: bump };
    } else {
      return version;
    }
  } else {
    return '';
  }
};
