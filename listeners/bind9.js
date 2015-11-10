// jshint esnext: true

var co = require('co');
var request = require('superagent');

var dnsCache = {};

module.exports = {
  start: function(row, data) {
    'use strict';
    return co(function*() {
      if (!data.Config.Labels) {
        return;
      }

      var domain = data.Config.Labels['com.docker.compose.service'].replace('_', '-') + '-' +
        data.Config.Labels['com.docker.compose.container-number'] + '.' +
        data.Config.Labels['com.docker.compose.project'].replace('_', '-');

      try {
        var ip = data.NetworkSettings.IPAddress;

        dnsCache[domain] = ip;

        var results = yield (this.nameservers || []).map(function(nameserver) {
          return new Promise(function(resolve, reject) {
            request
              .post(nameserver + '/zone/' + this.domain + '/record')
              .send({ key: domain, type: 'A', value: ip })
              .set('Accept', 'application/json')
              .end(function(err, data) {
                if (err) {
                  console.error('Error registering %s at %s, with error %s', domain, nameserver, err.message);
                } else {
                  console.log('Domain %s registered at %s', domain, nameserver);
                }
                resolve(data);
              });
          }.bind(this));
        }.bind(this));
      } catch(err) {
        console.error('Unknown error caught while registering %s: %s', domain, err.stack);
      }
    }.bind(this));
  },
  stop: function(row, data) {
    'use strict';

    return co(function*() {
      if (!data.Config.Labels) {
        return;
      }

      var domain = data.Config.Labels['com.docker.compose.service'].replace('_', '-') + '-' +
        data.Config.Labels['com.docker.compose.container-number'] + '.' +
        data.Config.Labels['com.docker.compose.project'].replace('_', '-');

      try {
        var ip = dnsCache[domain] || null;
        if (!ip) {
          throw new Error('IP for domain ' + domain + ' not found');
        }

        var result = yield this.nameservers.map(function(nameserver) {
          return new Promise(function(resolve, reject) {
            request
              .del(nameserver + '/zone/' + this.domain + '/record')
              .send({ key: domain, type: 'A', value: ip })
              .set('Accept', 'application/json')
              .end(function(err, res){
                if (err) {
                  console.error('Error unregistering %s at %s, with error %s', domain, nameserver, err.message);
                } else {
                  console.log('Domain %s unregistered at %s', domain, nameserver);
                }
                resolve(res);
              });
          }.bind(this));
        }.bind(this));
      } catch(err) {
        console.error('Unknown error caught while unregistering %s: %s', domain, err.stack);
      }
    }.bind(this));
  }
};