const WebSocketServer = require("websocket").server;
const promisify = require("util").promisify;

module.exports = function(httpServer, provider, logger) {
  const connectionManager = new ConnectionManager(provider, logger);

  const wsServer = new WebSocketServer({
    httpServer,
    autoAcceptConnections: true
  });

  wsServer.on("connect", connectionManager.manageConnection);

  return wsServer;
};

function ConnectionManager(provider, logger) {
  this.provider = provider;
  this.logger = logger;
  this.connectionsBySubscriptionId = new Map();

  this.manageConnection = this.manageConnection.bind(this);
  this._send = promisify(provider.send.bind(provider));

  provider.on("data", (err, notification) => {
    if (err) {
      return;
    }
    this._updateSubscriptions(notification);
  });
}

ConnectionManager.prototype.manageConnection = function(connection) {
  connection.subscriptions = new Set();

  connection.on("message", (message) => {
    try {
      var payload = JSON.parse(message.utf8Data);
    } catch (e) {
      connection.reject(400, "Bad Request");
      return;
    }

    this._logPayload(payload);
    this._handleRequest(connection, payload);
  });

  connection.once("close", async() => {
    // remove subscriptions
    connection.subscriptions.forEach((subscriptionId) => {
      const params = {
        jsonrpc: "2.0",
        method: "eth_unsubscribe",
        params: [subscriptionId],
        // It is very possible (it does happen) for requests to be sent so quickly that Date.now() returns
        // the same millisecond, so we don't use. Instead, just use the subscriptionId as the JSON RPC
        // request id. This will be unique as it cannot be reused and the close event will only ever
        // happen once.
        id: subscriptionId
      };

      this._send(params)
        .catch(() => {
          // discard error because we're closing the connection and can't do anything about it.
        })
        .finally(() => {
          this.connectionsBySubscriptionId.delete(subscriptionId);
        });
    });
  });
};

ConnectionManager.prototype._handleRequest = async function(connection, payload) {
  // we can't use the promisified version of `provider.send` here because
  // we have to handle the case where this is an error AND a result, as ganache
  // might send both (and a Promise can't resolve *and* reject). :-()
  this.provider.send(payload, (_err, result) => {
    connection.connected && connection.send(JSON.stringify(result));

    // handle subscription requests
    switch (payload.method) {
      case "eth_subscribe":
        if (result) {
          this._subscribe(connection, result.result);
        }
        break;
      case "eth_unsubscribe":
        if (payload.params) {
          this._unsubscribe(connection, payload.params[0]);
        }
        break;
    }
  });
};

ConnectionManager.prototype._subscribe = function(connection, subscriptionId) {
  if (this.connectionsBySubscriptionId.has(subscriptionId)) {
    throw new Error("Internal Error: Subscription ids cannot be reused.");
  }
  connection.subscriptions.add(subscriptionId);
  this.connectionsBySubscriptionId.set(subscriptionId, connection);
};

ConnectionManager.prototype._unsubscribe = function(connection, subscriptionId) {
  connection.subscriptions.delete(subscriptionId);
  this.connectionsBySubscriptionId.delete(subscriptionId);
};

// Log messages that come into Ganache
ConnectionManager.prototype._logPayload = function(payload) {
  const self = this;
  if (payload instanceof Array) {
    // Batch request
    for (var i = 0; i < payload.length; i++) {
      var item = payload[i];
      self.logger.log(item.method);
    }
  } else {
    self.logger.log(payload.method);
  }
};

ConnectionManager.prototype._updateSubscriptions = function(notification) {
  if (!notification.params) {
    return;
  }

  const subscriptionId = notification.params.subscription;
  if (!subscriptionId) {
    return;
  }

  if (!this.connectionsBySubscriptionId.has(subscriptionId)) {
    return;
  }
  const connection = this.connectionsBySubscriptionId.get(subscriptionId);
  connection.connected && connection.send(JSON.stringify(notification));
};
