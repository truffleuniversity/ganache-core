const Ganache = require(process.env.TEST_BUILD
  ? "../../build/ganache.core." + process.env.TEST_BUILD + ".js"
  : "../../../index.js");
const Web3 = require("web3");

/**
 * Initialize Ganache provider with `options`
 * @param {Object} options - Ganache provider options
 * @returns {Object} accounts, provider, web3 Object
 */
const initializeTestProvider = async(options = {}, simulator = { name: "ganache" }) => {
  let provider, web3;

  switch (simulator) {
    case "geth":
      provider = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
      web3 = new Web3(provider);
      break;
    case "parity":
      provider = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
      web3 = new Web3(provider);
      await web3.eth.personal.unlockAccount(simulator.unlockedAddress, "", null);
      break;
    default:
      provider = Ganache.provider(options);
      web3 = new Web3(provider);
      break;
  }

  const accounts = await web3.eth.getAccounts();

  return {
    accounts,
    provider,
    web3
  };
};

module.exports = initializeTestProvider;
