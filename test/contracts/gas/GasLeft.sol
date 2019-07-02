pragma solidity ^0.5.0;
contract GasLeft {
    function checkGas() public {
      require(gasleft() > 100000);
    }
}
