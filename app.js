// jshint esnext: true
var minimist = require('minimist')(process.argv);
var options = require('./lib/options')(minimist.c || null);
var Docker = require('dockerode');
var docker = new Docker(options.docker);
var JSONStream = require('JSONStream');
var parser = JSONStream.parse();
var listeners = require('./lib/listener')(options.listeners);
var co = require('co');

console.log('Start listening docker events...');

docker.getEvents(function(err, res) {
  'use strict';

  if (err) {
    console.error(err.stack);
    return;
  }

  parser.on('data', function(row) {
    return co(function *() {
      try {
        var container = docker.getContainer(row.id);
        var data = yield new Promise(function(resolve, reject) {
          container.inspect(function(err, data) {
            resolve(data);
          });
        });

        listeners.forEach(function(listener) {
          if (!listener[row.status] || typeof listener[row.status] !== 'function' || !listener.active) {
            return;
          }

          listener[row.status](row, data, container);
        });
      } catch(e) {
        console.error(e.stack);
      }
    });
  });

  res.pipe(parser);
});
