const isString = require("lodash/isString");
const isNumber = require("lodash/isNumber");
const Hash = require("eth-lib/lib/hash");
const utils = require("ethereumjs-util");
const ethjsUnit = require("ethjs-unit");
const numberToBN = require("number-to-bn");
const BN = require("bn.js");

const SHA3_NULL_S = "0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470";
const isHexStrict = (hex) => {
  return (isString(hex) || isNumber(hex)) && /^(-)?0x[0-9a-f]*$/i.test(hex);
};

const isBN = (object) => {
  return object instanceof BN || (object && object.constructor && object.constructor.name === "BN");
};

const hexToBytes = (hex) => {
  hex = hex.toString(16);

  if (!isHexStrict(hex)) {
    throw new Error(`Given value "${hex}" is not a valid hex string.`);
  }

  hex = hex.replace(/^0x/i, "");
  hex = hex.length % 2 ? "0" + hex : hex;

  let bytes = [];
  for (let c = 0; c < hex.length; c += 2) {
    bytes.push(parseInt(hex.substr(c, 2), 16));
  }

  return bytes;
};

module.exports = {
  buffer: function(val) {
    let data;
    if (typeof val === "string") {
      // strings need to be treated as hex, so we have to prep them:
      data = Buffer.from(utils.stripHexPrefix(val), "hex");
    } else if (Buffer.isBuffer(val)) {
      // no need to copy the Buffer to a new Buffer, so we just use the Buffer
      // exactly as it was given to us:
      data = val;
    } else {
      // all other types get the Buffer treatment and built-in type checking:
      data = Buffer.from(val);
    }
    return data;
  },
  // Note: Do not use to.hex() when you really mean utils.addHexPrefix().
  hex: function(val) {
    if (typeof val === "string") {
      if (val.indexOf("0x") === 0) {
        return val.trim();
      } else {
        val = new utils.BN(val);
      }
    }

    if (typeof val === "boolean") {
      val = val ? 1 : 0;
    }

    if (typeof val === "number") {
      val = utils.intToHex(val);
    } else if (val == null) {
      return "0x";
    } else if (typeof val === "object") {
      // Support Buffer, BigInteger and BN library
      // Hint: BN is used in ethereumjs
      val = val.toString("hex");
    }

    return utils.addHexPrefix(val);
  },

  _rpcQuantityHexString: function(val) {
    val = this.hex(val);
    // remove all zeroes leading zeros, `0+`, from the hex-encoded value
    // This doesn't remove the last 0 which would be captured by `(.+?)`
    val = val.replace(/^(?:0x)(?:0+(.+?))?$/, "0x$1");
    return val;
  },

  rpcQuantityHexString: function(val) {
    val = this._rpcQuantityHexString(val);

    // RPC Quantities must represent `0` as `0x0`
    if (val === "0x") {
      val = "0x0";
    }

    return val;
  },

  rpcDataHexString: function(val, length) {
    if (typeof length === "number") {
      val = this.hex(val).replace("0x", "");

      val = new Array(length - val.length).fill("0").join("") + val;
    } else {
      if (val.length === 0) {
        return "0x";
      }
      val = this.hex(val).replace("0x", "");

      if (val.length % 2 !== 0) {
        val = "0" + val;
      }
    }
    return "0x" + val;
  },

  nullableRpcDataHexString: function(val, length) {
    if (val === null) {
      return null;
    } else {
      const rpcDataHex = this.rpcDataHexString(val, length);
      return rpcDataHex === "0x" ? null : rpcDataHex;
    }
  },

  nullableRpcQuantityHexString: function(val, length) {
    if (val === null) {
      return null;
    } else {
      const rpcQuantityHex = this._rpcQuantityHexString(val, length);
      return rpcQuantityHex === "0x" ? null : rpcQuantityHex;
    }
  },

  hexWithZeroPadding: function(val) {
    val = this.hex(val);
    const digits = val.replace("0x", "");
    if (digits.length & 0x1) {
      return "0x0" + digits;
    }
    return val;
  },

  number: function(val) {
    if (typeof val === "number") {
      return val;
    }
    if (typeof val === "string") {
      if (val.indexOf("0x") !== 0) {
        return parseInt(val, 10);
      }
    }
    var bufVal = utils.toBuffer(val);
    return utils.bufferToInt(bufVal);
  },

  ether: function(number, from = "wei") {
    const val = ethjsUnit.fromWei(number, from);
    return isBN(number) ? val : val.toString(10);
  },

  wei: function(number, from = "ether") {
    const val = ethjsUnit.toWei(number, from);
    return isBN(number) ? val : val.toString(10);
  },

  BN: function(number) {
    try {
      return numberToBN(number);
    } catch (error) {
      throw new Error(`${error} Given value: "${number}"`);
    }
  },

  keccak256: function(value) {
    if (isHexStrict(value) && /^0x/i.test(value.toString())) {
      value = hexToBytes(value);
    }

    const returnValue = Hash.keccak256(value); // jshint ignore:line

    if (returnValue === SHA3_NULL_S) {
      return null;
    } else {
      return returnValue;
    }
  },

  rpcError: function(id, code, msg) {
    return JSON.stringify({
      jsonrpc: "2.0",
      id: id,
      error: {
        code: code,
        message: msg
      }
    });
  }
};
