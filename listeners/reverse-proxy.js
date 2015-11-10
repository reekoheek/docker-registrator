// jshint esnext: true

var request = require('superagent');

module.exports = {
  start: function(row, data) {
    'use strict';
    var domain = data.Config.Labels['id.sagara.farm.revproxy.domain'];
    var port = data.Config.Labels['id.sagara.farm.revproxy.port'] || 80;
    var upstream = data.Name.substr(1);

    if (!domain) {
      return;
    }
    // var upstream = data.NetworkSettings.IPAddress;

    return this.servers.map(function(server) {
      return new Promise(function(resolve, reject) {
        request
          .post(server + '/server')
          .send({name: domain})
          .set('Accept', 'application/json')
          .end(function(err, data) {
            return err ? reject(err) : resolve(data.body);
          });
      }).then(function(data) {
        return new Promise(function(resolve, reject) {
          request
            .post(server + '/server/' + data.normalized + '/upstream')
            .send({server: upstream, port: port})
            .set('Accept', 'application/json')
            .end(function(err, data) {
              return err ? reject(err) : resolve(data.body);
            });
        });
      }).then(function(data) {
        console.log('Reverse proxy registered for %s => %s:%s', domain, upstream, port);
      }, function(err) {
        console.error('Error registering reverse proxy %s => %s:%s, %s', domain, upstream, port, err.message);

      });
    });
  },

  stop: function(row, data) {
    'use strict';

    var domain = data.Config.Labels['id.sagara.farm.revproxy.domain'];
    var port = data.Config.Labels['id.sagara.farm.revproxy.port'] || 80;
    var upstream = data.Name.substr(1);
    // var upstream = data.NetworkSettings.IPAddress;
    var normalized = domain.replace('.', '_');

    if (!domain) {
      return;
    }

    return this.servers.map(function(server) {
      return new Promise(function(resolve, reject) {
        request
          .post(server + '/server')
          .send({name: domain})
          .set('Accept', 'application/json')
          .end(function(err, data) {
            return err ? reject(err) : resolve(data.body);
          });
      }).then(function(data) {
        return new Promise(function(resolve, reject) {
          request
            .post(server + '/server/' + normalized + '/upstream')
            .send({server: upstream, port: port})
            .set('Accept', 'application/json')
            .end(function(err, data) {
              return err ? reject(err) : resolve(data.body);
            });
        });
      }).then(function(data) {
        console.log('Reverse proxy unregistered for %s =/> %s:%s', domain, upstream, port);
      }, function(err) {
        console.error('Error unregistering reverse proxy %s => %s:%s, %s', domain, upstream, port, err.message);
      });
    });
  }
};