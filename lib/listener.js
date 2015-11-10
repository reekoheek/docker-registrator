var path = require('path');

module.exports = function(listeners) {
  'use strict';

  return Object.keys(listeners || []).map(function(name) {
    var listener = {
      name: name,
      active: true,
    };
    var meta = listeners[name];
    var proto = require(path.join(process.cwd(), meta.module));
    Object.keys(proto).forEach(function(key) {
      listener[key] = proto[key];
    });
    Object.keys(meta).forEach(function(key) {
      listener[key] = meta[key];
    });
    return listener;
  });
};
