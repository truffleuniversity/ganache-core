const { join } = require("path");
const { compileAndDeploy } = require("./compileAndDeploy");
const initializeTestProvider = require("../providers/initializeTestProvider");

/**
 * @param {Object} contractRef Object containing contract files and subdirectory path
 * @param {Object} options Provider options
 * @returns {Object} abi, accounts, bytecode, contract, instance, provider, receipt, sources, web3
 */
const bootstrap = async(contractRef = {}, options = {}, simulatorOptions = {}) => {
  const { accounts, provider, web3 } = await initializeTestProvider(options, simulatorOptions);

  const { contractFiles, contractSubdirectory } = contractRef;
  const [mainContractName, ...subContractNames] = contractFiles;
  const testAssets = await compileAndDeploy(
    mainContractName,
    subContractNames,
    join(__dirname, "..", "..", "contracts", `${contractSubdirectory}/`),
    web3,
    accounts
  );

  return Object.assign(testAssets, { provider, web3 });
};

module.exports = bootstrap;
