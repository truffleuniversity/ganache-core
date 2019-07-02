pragma solidity ^0.5.0;

contract CreateTwo {
  function deploy(bytes memory code, uint256 salt) public {
    assembly {
      let addr := create2(0, add(code, 0x20), mload(code), salt)
      if iszero(addr) {
        revert(0, 0)
      }
    }
  }
}
