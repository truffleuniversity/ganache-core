const genSend = require("./helpers/utils/rpc");
const Account = require("ethereumjs-account");
const { promisify } = require("util");
const utils = require("ethereumjs-util");
const bootstrap = require("./helpers/contract/bootstrap");
const BN = require("bn.js");
const assert = require("assert");

describe.only("Contract Storage", function() {
  it("Should not work? should work? i dunno", async function() {
    const contractRef = {
      contractFiles: ["Payable"],
      contractSubdirectory: "contract-storage"
    };

    const ganacheProviderOptions = { gasPrice: "0x0" };
    const context = await bootstrap(contractRef, ganacheProviderOptions);
    const { accounts, instance, provider, web3 } = context;

    const send = genSend(provider);
    const stateManager = provider.manager.state.blockchain.vm.stateManager;
    const putAccount = promisify(stateManager.putAccount.bind(stateManager));
    // veryBigNumber = "0x" + ("f".repeat(64));
    const amount = new BN(2).pow(new BN(256)).addn(2);
    console.log(new BN(2).pow(new BN(256)));
    const veryBigNumber = "0x" + amount.toString("hex");
    await Promise.all(
      accounts.map((account) => {
        return putAccount(
          utils.toBuffer(account),
          new Account({
            balance: veryBigNumber,
            nonce: "0x1",
            address: account
          })
        );
      })
    );
    // we need to mine a block for the putAccount to take effect
    await send("evm_mine");

    const balance = "0x" + new BN(await web3.eth.getBalance(accounts[0])).toString("hex");
    assert.strictEqual(balance, veryBigNumber);

    await instance.methods.deposit().send({ from: accounts[0], value: amount.divn(2) });
    const balance2 = new BN(await instance.methods.balance().call({ from: accounts[0] }));
    assert.ok(balance2.eq(amount.divn(2)));

    await instance.methods.deposit().send({ from: accounts[1], value: amount.divn(2) });
    const balance3 = new BN(await web3.eth.getBalance(instance._address));
    assert.ok(balance3.eq(amount));

    // This next line will crash ganache due to an exception coming from the vm.
    const balance4 = await instance.methods.balance().call({ from: accounts[1] });
    assert.ok(balance4.eq(amount));
  });
});
