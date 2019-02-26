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
  let accounts, provider, web3;

  switch (simulator.name) {
    case "geth":
      provider = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
      web3 = new Web3(provider);
      accounts = await web3.eth.getAccounts();
      break;
    case "parity":
      provider = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
      web3 = new Web3(provider);
      accounts = await web3.eth.getAccounts();
      await web3.eth.personal.unlockAccount(accounts[0], "", null);
      break;
    default:
      provider = Ganache.provider(options);
      web3 = new Web3(provider);
      accounts = await web3.eth.getAccounts();
      break;
  }

  return {
    accounts,
    provider,
    web3
  };
};

module.exports = initializeTestProvider;
