const assert = require("assert");
const bootstrap = require("../helpers/contract/bootstrap");
const randomInteger = require("../helpers/utils/generateRandomInteger");

// const PARITY_UNLOCKED_ADDR = process.env.PARITY_UNLOCKED_ADDR || "0x00a329c0648769A73afAc7F9381E08FB43dBEA72";
const SEED_RANGE = 1000000;
// const TARGET = process.env.TARGET || "ganache";

// const mnemonic = "candy maple cake sugar pudding cream honey rich smooth crumble sweet treat";

describe("Specifying a sender gas limit greater than block gas limitations", function() {
  let context;
  const seed = randomInteger(SEED_RANGE);

  const contractRef = {
    contractFiles: ["BlockGasLimit"],
    contractSubdirectory: "gas"
  };

  const ganacheProviderOptions = {
    blockTime: 2,
    seed
  };

  before("Setting up provider and contract", async function() {
    this.timeout(10000);

    const simulatorOptions = {
      name: "ganache"
      // unlockedAddress: PARITY_UNLOCKED_ADDR
    };

    context = await bootstrap(contractRef, ganacheProviderOptions, simulatorOptions);
  });

  const iterations = 10 ** 6;
  const clientGasLimit = 10 ** 8;

  it("should NOT generate a block gas limit error when calling a 'view' function", async function() {
    const { instance, web3 } = context;
    const block = await web3.eth.getBlock("latest");

    const isVeryHighGasLimit = clientGasLimit > block.gasLimit && clientGasLimit < Number.MAX_SAFE_INTEGER;
    assert.strictEqual(isVeryHighGasLimit, true);

    try {
      // Attempt to run an expensive view function
      await instance.methods.expensiveOperation(iterations).call({ gas: clientGasLimit });
      assert.fail("Expecting a block gas limit error when executing a expensive 'view' function");
    } catch (error) {
      assert.strictEqual(error.message, "Exceeds block gas limit");
    }
  });

  it("when calling a 'pure' function should generate a block gas limit error", async function() {
    const { instance, web3 } = context;
    const block = await web3.eth.getBlock("latest");

    const isVeryHighGas = clientGasLimit > block.gasLimit && clientGasLimit < Number.MAX_SAFE_INTEGER;
    assert.strictEqual(isVeryHighGas, true);

    try {
      await instance.methods.pureExpensiveOperation(iterations).call({ gas: clientGasLimit });
      assert.fail("Expecting a block gas limit error when executing a expensive 'pure' function");
    } catch (error) {
      assert.strictEqual(error.message, "Exceeds block gas limit");
    }
  });

  /*
   * Enable if running a Geth or Parity node
   */
  // eslint-disable-next-line max-len
  it.skip("GETH/PARITY ONLY: when calling a 'pure' function does NOT generate a block gas limit error", async function() {
    const { instance, web3 } = context;
    const block1 = await web3.eth.getBlock("latest");

    const status = await instance.methods.pureExpensiveOperation(iterations).call({
      gas: clientGasLimit
    });

    const block2 = await web3.eth.getBlock("latest");

    assert.strictEqual(block1.number, block2.number);
    assert.strictEqual(status, true);
  });

  /*
   * Enable if running a Geth or Parity node
   */
  // eslint-disable-next-line max-len
  it.skip("GETH/PARITY ONLY: when calling a 'view' function does NOT generate a block gas limit error", async function() {
    const { instance } = context;

    try {
      // Attempt to run an expensive view function
      await instance.methods.expensiveOperation(iterations).call({ gas: clientGasLimit });
      assert.fail("Expecting a block gas limit error when executing a expensive 'view' function");
    } catch (error) {
      assert.strictEqual(error.message, "Expecting a block gas limit error when executing a expensive 'view' function");
    }
  });
});
