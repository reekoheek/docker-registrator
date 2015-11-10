var fs = require('fs');
var path = require('path');
var yaml = require('js-yaml');
var url = require('url');

var cachedOptions;

module.exports = function(file) {
  'use strict';

  if (cachedOptions) {
    return cachedOptions;
  }

  var options = yaml.safeLoad(fs.readFileSync(file)) || {};

  if (!options.docker) {
    options.docker = {};

    var dockerHost = process.env.DOCKER_HOST;
    var dockerCertPath = process.env.DOCKER_CERT_PATH;

    if (dockerHost) {
      var parsed = url.parse(dockerHost);

      options.docker.host = parsed.hostname;
      options.docker.port = parsed.port;

      if (dockerCertPath) {
        options.docker.key = fs.readFileSync(path.join(dockerCertPath, 'key.pem'));
        options.docker.cert = fs.readFileSync(path.join(dockerCertPath, 'cert.pem'));
        options.docker.ca = fs.readFileSync(path.join(dockerCertPath, 'ca.pem'));
      }
    } else {
      options.docker.socketPath = process.env.DOCKER_SOCKET_PATH || '/var/run/docker.sock';
    }
  }

  cachedOptions = options;

  return cachedOptions;
};
