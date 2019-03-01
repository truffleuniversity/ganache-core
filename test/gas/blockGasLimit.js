const assert = require("assert");
const bootstrap = require("../helpers/contract/bootstrap");
const randomInteger = require("../helpers/utils/generateRandomInteger");

const SEED_RANGE = 1000000;
const TARGETS = ["ganache", "geth", "parity"];

TARGETS.forEach((simulator) => {
  describe.only(`SIMULATOR: ${simulator.toUpperCase()}`, function() {
    describe("Specifying a sender gas limit greater than block gas limitations", function() {
      let context;
      const seed = randomInteger(SEED_RANGE);

      const contractRef = {
        contractFiles: ["BlockGasLimit"],
        contractSubdirectory: "gas"
      };

      before("Setting up provider and contract", async function() {
        this.timeout(10000);

        const ganacheProviderOptions = {
          blockTime: 2,
          seed
        };

        context = await bootstrap(contractRef, ganacheProviderOptions, simulator);
      });

      const iterations = 10 ** 6;
      const clientGasLimit = 10 ** 8;

      if (simulator === "ganache") {
        it("GANACHE ONLY:should NOT generate a block gas limit error when calling a 'view' function", async function() {
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
      }

      if (simulator === "ganache") {
        it("GANACHE ONLY: when calling a 'pure' function should generate a block gas limit error", async function() {
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
      }

      /*
       * Enable if running a Geth or Parity node
       */
      if (simulator === "geth" || simulator === "parity") {
        // eslint-disable-next-line max-len
        it("GETH/PARITY ONLY: when calling a 'pure' function does NOT generate a block gas limit error", async function() {
          const { instance, web3 } = context;
          const block1 = await web3.eth.getBlock("latest");

          const status = await instance.methods.pureExpensiveOperation(iterations).call({ gas: clientGasLimit });

          const block2 = await web3.eth.getBlock("latest");

          assert.strictEqual(block1.number, block2.number);
          assert.strictEqual(status, true);
        });
      }

      /*
       * Enable if running a Geth or Parity node
       */
      if (simulator === "geth" || simulator === "parity") {
        // eslint-disable-next-line max-len
        it("GETH/PARITY ONLY: when calling a 'view' function does NOT generate a block gas limit error", async function() {
          const { instance, web3 } = context;

          const block1 = await web3.eth.getBlock("latest");
          await instance.methods.expensiveOperation(iterations).call({ gas: clientGasLimit });

          const block2 = await web3.eth.getBlock("latest");
          assert.strictEqual(block1.number, block2.number);
        });
      }
    });
  });
});
