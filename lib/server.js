// make sourcemaps work!
require("source-map-support/register");

var Provider = require("./provider");
var webSocketServer = require("./webSocketServer");
var httpServer = require("./httpServer");
var _ = require("lodash");

module.exports = {
  create: function(options) {
    options = _applyDefaultOptions(options || {});

    var logger = options.logger;
    var provider = new Provider(options);

    var server = httpServer(provider, logger);
    server.keepAliveTimeout = options.keepAliveTimeout;

    var oldListen = server.listen;

    server.listen = function() {
      var args = Array.prototype.slice.call(arguments);
      var callback = function() {};
      if (args.length > 0) {
        var last = args[args.length - 1];
        if (typeof last === "function") {
          callback = args.pop();
        }
      }

      var intermediary = function(err) {
        if (err) {
          return callback(err);
        }
        server.provider.manager.waitForInitialization(callback);
      };

      args.push(intermediary);

      oldListen.apply(server, args);
    };

    server.provider = provider;

    if (options.ws) {
      webSocketServer(server, provider, logger);
    }

    server.once("close", () => {
      provider.close();
    });

    return server;
  }
};

const defaultOptions = {
  logger: {
    log: function() {}
  },
  ws: true,
  keepAliveTimeout: 5000
};

var _applyDefaultOptions = function(options) {
  return _.merge({}, defaultOptions, options);
};
