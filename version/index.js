var fs = require('fs');
var path = require('path');
var semver = require('semver');

module.exports = function(bump, filename, nosave) {
  filename = filename || 'package.json';
  filename = path.join(process.cwd(), filename);
  var package_file = JSON.parse(fs.readFileSync(filename));
  var version = semver.valid(package_file.version);
  if (version) {
    if (bump) {
      if (bump !== 'none') {
        package_file.version = semver.inc(version, bump);
      }
      if (!nosave && bump !== 'none') {
        fs.writeFileSync(filename, JSON.stringify(package_file, null, '  '));
      }
      return { from: version, to: package_file.version, bump: bump };
    } else {
      return version;
    }
  } else {
    return '';
  }

};
